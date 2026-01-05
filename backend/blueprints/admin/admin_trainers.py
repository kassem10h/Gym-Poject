from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from models import db, User, Trainer

admin_trainers_bp = Blueprint('admin_trainers', __name__, url_prefix='/api/admin/trainers')


def check_admin_role(user_id):
    """Check if user has admin role"""
    user = User.query.get(user_id)
    if not user or user.role != 'Admin':
        return False
    return True


@admin_trainers_bp.route('/', methods=['GET'])
@jwt_required()
def get_all_trainers():
    """
    Get all trainers with their profiles
    Query params: 
    - status: 'active', 'inactive', or 'all' (default: 'all')
    - page: page number (default: 1)
    - limit: items per page (default: 20)
    """
    user_id = get_jwt_identity()
    
    if not check_admin_role(user_id):
        return jsonify({'error': 'Admin access required'}), 403
    
    try:
        # Get query parameters
        status = request.args.get('status', 'all')
        page = int(request.args.get('page', 1))
        limit = int(request.args.get('limit', 20))
        
        # Base query - get all users with role Trainer
        query = User.query.filter_by(role='Trainer')
        
        # Filter by status
        if status == 'active':
            query = query.filter_by(is_active=True)
        elif status == 'inactive':
            query = query.filter_by(is_active=False)
        
        # Paginate
        trainers_paginated = query.order_by(User.created_at.desc()).paginate(
            page=page, 
            per_page=limit, 
            error_out=False
        )
        
        trainers_list = []
        for user in trainers_paginated.items:
            # Get trainer profile if exists
            trainer_profile = Trainer.query.filter_by(user_id=user.user_id).first()
            
            trainer_data = {
                'user_id': user.user_id,
                'email': user.email,
                'first_name': user.first_name,
                'last_name': user.last_name,
                'phone': user.phone,
                'date_of_birth': user.date_of_birth.isoformat() if user.date_of_birth else None,
                'gender': user.gender,
                'is_active': user.is_active,
                'created_at': user.created_at.isoformat() if user.created_at else None,
                'has_profile': trainer_profile is not None,
                'profile': None
            }
            
            if trainer_profile:
                trainer_data['profile'] = {
                    'trainer_id': trainer_profile.trainer_id,
                    'years_of_experience': trainer_profile.years_of_experience,
                    'hourly_rate': float(trainer_profile.hourly_rate) if trainer_profile.hourly_rate else None,
                    'specialization': trainer_profile.specialization,
                    'bio': trainer_profile.bio,
                    'height': float(trainer_profile.height) if trainer_profile.height else None,
                    'weight': float(trainer_profile.weight) if trainer_profile.weight else None,
                    'certifications': trainer_profile.certifications,
                    'profile_picture_url': trainer_profile.profile_picture_url
                }
            
            trainers_list.append(trainer_data)
        
        return jsonify({
            'trainers': trainers_list,
            'pagination': {
                'page': page,
                'limit': limit,
                'total': trainers_paginated.total,
                'pages': trainers_paginated.pages,
                'has_next': trainers_paginated.has_next,
                'has_prev': trainers_paginated.has_prev
            }
        }), 200
        
    except Exception as e:
        return jsonify({'error': f'Failed to fetch trainers: {str(e)}'}), 500


@admin_trainers_bp.route('/<user_id>', methods=['GET'])
@jwt_required()
def get_trainer_by_id(user_id):
    """Get a specific trainer's details"""
    admin_id = get_jwt_identity()
    
    if not check_admin_role(admin_id):
        return jsonify({'error': 'Admin access required'}), 403
    
    try:
        user = User.query.filter_by(user_id=user_id, role='Trainer').first()
        
        if not user:
            return jsonify({'error': 'Trainer not found'}), 404
        
        trainer_profile = Trainer.query.filter_by(user_id=user.user_id).first()
        
        trainer_data = {
            'user_id': user.user_id,
            'email': user.email,
            'first_name': user.first_name,
            'last_name': user.last_name,
            'phone': user.phone,
            'date_of_birth': user.date_of_birth.isoformat() if user.date_of_birth else None,
            'gender': user.gender,
            'is_active': user.is_active,
            'created_at': user.created_at.isoformat() if user.created_at else None,
            'updated_at': user.updated_at.isoformat() if user.updated_at else None,
            'has_profile': trainer_profile is not None,
            'profile': None
        }
        
        if trainer_profile:
            trainer_data['profile'] = {
                'trainer_id': trainer_profile.trainer_id,
                'years_of_experience': trainer_profile.years_of_experience,
                'hourly_rate': float(trainer_profile.hourly_rate) if trainer_profile.hourly_rate else None,
                'specialization': trainer_profile.specialization,
                'bio': trainer_profile.bio,
                'height': float(trainer_profile.height) if trainer_profile.height else None,
                'weight': float(trainer_profile.weight) if trainer_profile.weight else None,
                'certifications': trainer_profile.certifications,
                'profile_picture_url': trainer_profile.profile_picture_url,
                'created_at': trainer_profile.created_at.isoformat() if trainer_profile.created_at else None,
                'updated_at': trainer_profile.updated_at.isoformat() if trainer_profile.updated_at else None
            }
        
        return jsonify({'trainer': trainer_data}), 200
        
    except Exception as e:
        return jsonify({'error': f'Failed to fetch trainer: {str(e)}'}), 500


@admin_trainers_bp.route('/<user_id>/activate', methods=['PATCH'])
@jwt_required()
def activate_trainer(user_id):
    """Activate a trainer account"""
    admin_id = get_jwt_identity()
    
    if not check_admin_role(admin_id):
        return jsonify({'error': 'Admin access required'}), 403
    
    try:
        user = User.query.filter_by(user_id=user_id, role='Trainer').first()
        
        if not user:
            return jsonify({'error': 'Trainer not found'}), 404
        
        # Check if trainer has completed profile
        trainer_profile = Trainer.query.filter_by(user_id=user.user_id).first()
        if not trainer_profile:
            return jsonify({'error': 'Trainer must complete profile before activation'}), 400
        
        user.is_active = True
        db.session.commit()
        
        return jsonify({
            'message': 'Trainer activated successfully',
            'trainer': {
                'user_id': user.user_id,
                'email': user.email,
                'first_name': user.first_name,
                'last_name': user.last_name,
                'is_active': user.is_active
            }
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': f'Failed to activate trainer: {str(e)}'}), 500


@admin_trainers_bp.route('/<user_id>/deactivate', methods=['PATCH'])
@jwt_required()
def deactivate_trainer(user_id):
    """Deactivate a trainer account"""
    admin_id = get_jwt_identity()
    
    if not check_admin_role(admin_id):
        return jsonify({'error': 'Admin access required'}), 403
    
    try:
        user = User.query.filter_by(user_id=user_id, role='Trainer').first()
        
        if not user:
            return jsonify({'error': 'Trainer not found'}), 404
        
        user.is_active = False
        db.session.commit()
        
        return jsonify({
            'message': 'Trainer deactivated successfully',
            'trainer': {
                'user_id': user.user_id,
                'email': user.email,
                'first_name': user.first_name,
                'last_name': user.last_name,
                'is_active': user.is_active
            }
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': f'Failed to deactivate trainer: {str(e)}'}), 500


@admin_trainers_bp.route('/<user_id>', methods=['DELETE'])
@jwt_required()
def delete_trainer(user_id):
    """Delete a trainer account (use with caution)"""
    admin_id = get_jwt_identity()
    
    if not check_admin_role(admin_id):
        return jsonify({'error': 'Admin access required'}), 403
    
    try:
        user = User.query.filter_by(user_id=user_id, role='Trainer').first()
        
        if not user:
            return jsonify({'error': 'Trainer not found'}), 404
        
        # Delete trainer profile first (if exists)
        trainer_profile = Trainer.query.filter_by(user_id=user.user_id).first()
        if trainer_profile:
            db.session.delete(trainer_profile)
        
        # Delete user
        db.session.delete(user)
        db.session.commit()
        
        return jsonify({'message': 'Trainer deleted successfully'}), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': f'Failed to delete trainer: {str(e)}'}), 500


@admin_trainers_bp.route('/stats', methods=['GET'])
@jwt_required()
def get_trainer_stats():
    """Get trainer statistics"""
    admin_id = get_jwt_identity()
    
    if not check_admin_role(admin_id):
        return jsonify({'error': 'Admin access required'}), 403
    
    try:
        total_trainers = User.query.filter_by(role='Trainer').count()
        active_trainers = User.query.filter_by(role='Trainer', is_active=True).count()
        inactive_trainers = User.query.filter_by(role='Trainer', is_active=False).count()
        
        # Trainers with completed profiles
        trainers_with_profiles = db.session.query(User).join(
            Trainer, User.user_id == Trainer.user_id
        ).filter(User.role == 'Trainer').count()
        
        # Trainers without profiles
        trainers_without_profiles = total_trainers - trainers_with_profiles
        
        return jsonify({
            'stats': {
                'total_trainers': total_trainers,
                'active_trainers': active_trainers,
                'inactive_trainers': inactive_trainers,
                'trainers_with_profiles': trainers_with_profiles,
                'trainers_without_profiles': trainers_without_profiles
            }
        }), 200
        
    except Exception as e:
        return jsonify({'error': f'Failed to fetch stats: {str(e)}'}), 500