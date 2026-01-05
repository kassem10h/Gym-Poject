from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from models import db, User, Trainer
from werkzeug.utils import secure_filename
import os
from datetime import datetime

trainer_profile_bp = Blueprint('trainer_profile', __name__, url_prefix='/api/trainer/profile')

# Configure upload settings
UPLOAD_FOLDER = 'uploads/profile_pictures'
ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif'}

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS


@trainer_profile_bp.route('/', methods=['GET'])
@jwt_required()
def get_trainer_profile():
    """Get trainer's profile"""
    user_id = get_jwt_identity()
    user = User.query.get(user_id)
    
    if not user:
        return jsonify({'error': 'User not found'}), 404
    
    if user.role != 'Trainer':
        return jsonify({'error': 'User is not a trainer'}), 403
    
    trainer = Trainer.query.filter_by(user_id=user_id).first()
    
    if not trainer:
        return jsonify({'error': 'Trainer profile not found'}), 404
    
    return jsonify({
        'trainer_id': trainer.trainer_id,
        'user_id': trainer.user_id,
        'years_of_experience': trainer.years_of_experience,
        'hourly_rate': float(trainer.hourly_rate) if trainer.hourly_rate else None,
        'specialization': trainer.specialization,
        'bio': trainer.bio,
        'height': float(trainer.height) if trainer.height else None,
        'weight': float(trainer.weight) if trainer.weight else None,
        'profile_picture_url': trainer.profile_picture_url,
        'certifications': trainer.certifications,
        'created_at': trainer.created_at.isoformat() if trainer.created_at else None,
        'updated_at': trainer.updated_at.isoformat() if trainer.updated_at else None
    }), 200


@trainer_profile_bp.route('/', methods=['POST'])
@jwt_required()
def create_trainer_profile():
    """Create trainer profile (if doesn't exist)"""
    user_id = get_jwt_identity()
    user = User.query.get(user_id)
    
    if not user:
        return jsonify({'error': 'User not found'}), 404
    
    if user.role != 'Trainer':
        return jsonify({'error': 'User is not a trainer'}), 403
    
    # Check if profile already exists
    existing_trainer = Trainer.query.filter_by(user_id=user_id).first()
    if existing_trainer:
        return jsonify({'error': 'Trainer profile already exists'}), 400
    
    data = request.get_json()
    
    trainer = Trainer(
        user_id=user_id,
        years_of_experience=data.get('years_of_experience'),
        hourly_rate=data.get('hourly_rate'),
        specialization=data.get('specialization', ''),  # Default to empty string
        bio=data.get('bio', ''),  # Default to empty string
        height=data.get('height'),
        weight=data.get('weight'),
        certifications=data.get('certifications', '')  # Default to empty string
    )
    
    try:
        db.session.add(trainer)
        db.session.commit()
        return jsonify({
            'message': 'Trainer profile created successfully',
            'trainer_id': trainer.trainer_id
        }), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500
    
@trainer_profile_bp.route('/update-profile', methods=['PUT'])
@jwt_required()
def update_user_profile():
    user_id = get_jwt_identity()
    user = User.query.get(user_id)

    if not user:
        return jsonify({"error": "User not found"}), 404

    data = request.get_json() or {}

    # Allowed fields only
    allowed_fields = {
        "first_name",
        "last_name",
        "phone",
        "date_of_birth",
        "gender"
    }

    for field in allowed_fields:
        if field not in data:
            continue

        value = data[field]

        if field == "date_of_birth":
            if value is None or value == "":
                user.date_of_birth = None
            else:
                try:
                    user.date_of_birth = datetime.strptime(
                        value, "%Y-%m-%d"
                    ).date()
                except ValueError:
                    return jsonify({
                        "error": "date_of_birth must be YYYY-MM-DD"
                    }), 400
        else:
            setattr(user, field, value)


    db.session.commit()

    return jsonify({
        "message": "Profile updated successfully",
        "user": {
            "user_id": user.user_id,
            "email": user.email,
            "first_name": user.first_name,
            "last_name": user.last_name,
            "phone": user.phone,
            "date_of_birth": user.date_of_birth.isoformat() if user.date_of_birth else None,
            "gender": user.gender,
            "role": user.role
        }
    }), 200

@trainer_profile_bp.route('/', methods=['PUT'])
@jwt_required()
def update_trainer_profile():
    """Update trainer profile"""
    user_id = get_jwt_identity()
    user = User.query.get(user_id)
    
    if not user:
        return jsonify({'error': 'User not found'}), 404
    
    if user.role != 'Trainer':
        return jsonify({'error': 'User is not a trainer'}), 403
    
    trainer = Trainer.query.filter_by(user_id=user_id).first()
    
    # If trainer profile doesn't exist, create it
    if not trainer:
        trainer = Trainer(user_id=user_id)
        db.session.add(trainer)
    
    data = request.get_json()
    
    # Update fields if provided (handle empty strings properly)
    if 'years_of_experience' in data:
        trainer.years_of_experience = data['years_of_experience'] if data['years_of_experience'] else None
    if 'hourly_rate' in data:
        trainer.hourly_rate = data['hourly_rate'] if data['hourly_rate'] else None
    if 'specialization' in data:
        trainer.specialization = data['specialization'] if data['specialization'] else ''
    if 'bio' in data:
        trainer.bio = data['bio'] if data['bio'] else ''
    if 'height' in data:
        trainer.height = data['height'] if data['height'] else None
    if 'weight' in data:
        trainer.weight = data['weight'] if data['weight'] else None
    if 'certifications' in data:
        trainer.certifications = data['certifications'] if data['certifications'] else ''
    
    trainer.updated_at = datetime.utcnow()
    
    try:
        db.session.commit()
        return jsonify({
            'message': 'Trainer profile updated successfully',
            'trainer_id': trainer.trainer_id
        }), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@trainer_profile_bp.route('/upload-picture', methods=['POST'])
@jwt_required()
def upload_profile_picture():
    """Upload profile picture"""
    user_id = get_jwt_identity()
    user = User.query.get(user_id)
    
    if not user:
        return jsonify({'error': 'User not found'}), 404
    
    if user.role != 'Trainer':
        return jsonify({'error': 'User is not a trainer'}), 403
    
    trainer = Trainer.query.filter_by(user_id=user_id).first()
    
    # Create trainer profile if it doesn't exist
    if not trainer:
        trainer = Trainer(user_id=user_id)
        db.session.add(trainer)
        db.session.flush()  # Get the trainer_id without committing
    
    if 'file' not in request.files:
        return jsonify({'error': 'No file provided'}), 400
    
    file = request.files['file']
    
    if file.filename == '':
        return jsonify({'error': 'No file selected'}), 400
    
    if file and allowed_file(file.filename):
        # Delete old profile picture if exists
        if trainer.profile_picture_url:
            old_filepath = os.path.join('uploads', trainer.profile_picture_url.lstrip('/'))
            if os.path.exists(old_filepath):
                try:
                    os.remove(old_filepath)
                except Exception as e:
                    print(f"Failed to delete old profile picture: {e}")
        
        # Create unique filename
        filename = secure_filename(f"{user_id}_{int(datetime.now().timestamp())}_{file.filename}")
        
        # Ensure upload directory exists
        os.makedirs(UPLOAD_FOLDER, exist_ok=True)
        
        filepath = os.path.join(UPLOAD_FOLDER, filename)
        file.save(filepath)
        
        # Update trainer profile with new picture URL
        trainer.profile_picture_url = f"/uploads/profile_pictures/{filename}"
        trainer.updated_at = datetime.utcnow()
        
        try:
            db.session.commit()
            return jsonify({
                'message': 'Profile picture uploaded successfully',
                'profile_picture_url': trainer.profile_picture_url
            }), 200
        except Exception as e:
            db.session.rollback()
            # Clean up uploaded file if database update fails
            if os.path.exists(filepath):
                os.remove(filepath)
            return jsonify({'error': str(e)}), 500
    
    return jsonify({'error': 'Invalid file type'}), 400


@trainer_profile_bp.route('/', methods=['DELETE'])
@jwt_required()
def delete_trainer_profile():
    """Delete trainer profile"""
    user_id = get_jwt_identity()
    user = User.query.get(user_id)
    
    if not user:
        return jsonify({'error': 'User not found'}), 404
    
    if user.role != 'Trainer':
        return jsonify({'error': 'User is not a trainer'}), 403
    
    trainer = Trainer.query.filter_by(user_id=user_id).first()
    
    if not trainer:
        return jsonify({'error': 'Trainer profile not found'}), 404
    
    try:
        # Delete profile picture if exists
        if trainer.profile_picture_url:
            filepath = os.path.join('uploads', trainer.profile_picture_url.lstrip('/'))
            if os.path.exists(filepath):
                try:
                    os.remove(filepath)
                except Exception as e:
                    print(f"Failed to delete profile picture: {e}")
        
        db.session.delete(trainer)
        db.session.commit()
        return jsonify({'message': 'Trainer profile deleted successfully'}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500