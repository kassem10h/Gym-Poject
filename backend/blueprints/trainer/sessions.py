from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from datetime import datetime, time, date
from models import db, User, TrainerSession, ClassType, Booking
from sqlalchemy import and_, or_

session_bp = Blueprint('sessions', __name__, url_prefix='/api/sessions')

# ==================== SESSION MANAGEMENT ====================

@session_bp.route('/', methods=['GET'])
@jwt_required() 
def get_my_sessions():
    """Get all sessions for the logged-in trainer"""
    try:
        trainer_id = get_jwt_identity()
        
        # Verify user is a trainer
        user = User.query.get(trainer_id)
        if not user or user.role != 'Trainer':
            return jsonify({'error': 'Unauthorized - Trainers only'}), 403
        
        sessions = TrainerSession.query.filter_by(
            trainer_id=trainer_id,
            is_active=True
        ).order_by(TrainerSession.date.desc(), TrainerSession.start_time.desc()).all()
        
        return jsonify({
            'sessions': [{
                'id': s.id,
                'class_type': s.class_type.name,
                'class_type_id': s.class_type_id,
                'date': s.date.isoformat(),
                'start_time': s.start_time.strftime('%H:%M'),
                'end_time': s.end_time.strftime('%H:%M'),
                'price': s.price,
                'max_members': s.max_members,
                'current_bookings': s.current_bookings,
                'spots_remaining': s.spots_remaining,
                'is_full': s.is_full,
                'created_at': s.created_at.isoformat() if s.created_at else None
            } for s in sessions]
        }), 200
        
    except Exception as e:
        return jsonify({'error': f'Failed to fetch sessions: {str(e)}'}), 500


@session_bp.route('/', methods=['POST'])
@jwt_required()
def create_session():
    """
    Create a new trainer session
    Body: {
        "class_type_id": 1,
        "date": "2024-12-01",
        "start_time": "17:00",
        "end_time": "19:00",
        "price": 25.00,
        "max_members": 10
    }
    """
    try:
        trainer_id = get_jwt_identity()
        
        # Verify user is a trainer
        user = User.query.get(trainer_id)
        if not user or user.role != 'Trainer':
            return jsonify({'error': 'Unauthorized - Trainers only'}), 403
        
        data = request.get_json()
        
        # Validation
        required_fields = ['class_type_id', 'date', 'start_time', 'end_time', 'price', 'max_members']
        for field in required_fields:
            if field not in data:
                return jsonify({'error': f'{field} is required'}), 400
        
        # Parse date and time
        try:
            session_date = datetime.strptime(data['date'], '%Y-%m-%d').date()
            start_time = datetime.strptime(data['start_time'], '%H:%M').time()
            end_time = datetime.strptime(data['end_time'], '%H:%M').time()
        except ValueError:
            return jsonify({'error': 'Invalid date or time format'}), 400
        
        # Validate time logic
        if start_time >= end_time:
            return jsonify({'error': 'End time must be after start time'}), 400
        
        # Validate date is not in the past
        if session_date < date.today():
            return jsonify({'error': 'Cannot create session in the past'}), 400
        
        # Validate price and max_members
        if data['price'] <= 0:
            return jsonify({'error': 'Price must be greater than 0'}), 400
        
        if data['max_members'] <= 0:
            return jsonify({'error': 'Max members must be greater than 0'}), 400
        
        # Check if class type exists
        class_type = ClassType.query.get(data['class_type_id'])
        if not class_type:
            return jsonify({'error': 'Class type not found'}), 404
        
        # CRITICAL: Check for overlapping sessions with SAME class type
        overlapping_session = TrainerSession.query.filter(
            and_(
                TrainerSession.trainer_id == trainer_id,
                # REMOVED: TrainerSession.class_type_id == data['class_type_id'],
                TrainerSession.date == session_date,
                TrainerSession.is_active == True,
                or_(
                    # New session starts during existing session
                    and_(
                        TrainerSession.start_time <= start_time,
                        TrainerSession.end_time > start_time
                    ),
                    # New session ends during existing session
                    and_(
                        TrainerSession.start_time < end_time,
                        TrainerSession.end_time >= end_time
                    ),
                    # New session completely contains existing session
                    and_(
                        TrainerSession.start_time >= start_time,
                        TrainerSession.end_time <= end_time
                    )
                )
            )
        ).first()

        if overlapping_session:
            return jsonify({
                'error': f'You already have a "{overlapping_session.class_type.name}" session scheduled from {overlapping_session.start_time.strftime("%H:%M")} to {overlapping_session.end_time.strftime("%H:%M")} on this date. You cannot teach two classes at the same time.'
            }), 409
        
        # Create session
        new_session = TrainerSession(
            trainer_id=trainer_id,
            class_type_id=data['class_type_id'],
            date=session_date,
            start_time=start_time,
            end_time=end_time,
            price=data['price'],
            max_members=data['max_members']
        )
        
        db.session.add(new_session)
        db.session.commit()
        
        return jsonify({
            'message': 'Session created successfully',
            'session': {
                'id': new_session.id,
                'class_type': class_type.name,
                'date': new_session.date.isoformat(),
                'start_time': new_session.start_time.strftime('%H:%M'),
                'end_time': new_session.end_time.strftime('%H:%M'),
                'price': new_session.price,
                'max_members': new_session.max_members
            }
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': f'Failed to create session: {str(e)}'}), 500


@session_bp.route('/<int:session_id>', methods=['PUT'])
@jwt_required()
def update_session(session_id):
    """Update a session"""
    try:
        trainer_id = get_jwt_identity()
        
        session = TrainerSession.query.get(session_id)
        if not session:
            return jsonify({'error': 'Session not found'}), 404
        
        # Verify ownership
        if session.trainer_id != trainer_id:
            return jsonify({'error': 'Unauthorized'}), 403
        
        # Don't allow updating if session has bookings
        if session.current_bookings > 0:
            return jsonify({'error': 'Cannot update session with existing bookings'}), 400
        
        data = request.get_json()
        
        # Parse and update date/time if provided
        if 'date' in data:
            try:
                new_date = datetime.strptime(data['date'], '%Y-%m-%d').date()
                if new_date < date.today():
                    return jsonify({'error': 'Cannot set date in the past'}), 400
                session.date = new_date
            except ValueError:
                return jsonify({'error': 'Invalid date format'}), 400
        
        if 'start_time' in data:
            try:
                session.start_time = datetime.strptime(data['start_time'], '%H:%M').time()
            except ValueError:
                return jsonify({'error': 'Invalid start time format'}), 400
        
        if 'end_time' in data:
            try:
                session.end_time = datetime.strptime(data['end_time'], '%H:%M').time()
            except ValueError:
                return jsonify({'error': 'Invalid end time format'}), 400
        
        if session.start_time >= session.end_time:
            return jsonify({'error': 'End time must be after start time'}), 400
        
        # Update other fields
        if 'class_type_id' in data:
            class_type = ClassType.query.get(data['class_type_id'])
            if not class_type:
                return jsonify({'error': 'Class type not found'}), 404
            session.class_type_id = data['class_type_id']
        
        if 'price' in data:
            if data['price'] <= 0:
                return jsonify({'error': 'Price must be greater than 0'}), 400
            session.price = data['price']
        
        if 'max_members' in data:
            if data['max_members'] <= 0:
                return jsonify({'error': 'Max members must be greater than 0'}), 400
            session.max_members = data['max_members']
        
        # Check for overlapping sessions (exclude current session)
        overlapping_session = TrainerSession.query.filter(
            and_(
                TrainerSession.id != session_id,
                TrainerSession.trainer_id == trainer_id,
                # REMOVED: TrainerSession.class_type_id == session.class_type_id,
                TrainerSession.date == session.date,
                TrainerSession.is_active == True,
                or_(
                    and_(
                        TrainerSession.start_time <= session.start_time,
                        TrainerSession.end_time > session.start_time
                    ),
                    and_(
                        TrainerSession.start_time < session.end_time,
                        TrainerSession.end_time >= session.end_time
                    ),
                    and_(
                        TrainerSession.start_time >= session.start_time,
                        TrainerSession.end_time <= session.end_time
                    )
                )
            )
        ).first()

        if overlapping_session:
            return jsonify({
                'error': f'You already have a "{overlapping_session.class_type.name}" session scheduled from {overlapping_session.start_time.strftime("%H:%M")} to {overlapping_session.end_time.strftime("%H:%M")} on this date. You cannot teach two classes at the same time.'
            }), 409
        
        db.session.commit()
        
        return jsonify({
            'message': 'Session updated successfully',
            'session': {
                'id': session.id,
                'class_type': session.class_type.name,
                'date': session.date.isoformat(),
                'start_time': session.start_time.strftime('%H:%M'),
                'end_time': session.end_time.strftime('%H:%M'),
                'price': session.price,
                'max_members': session.max_members
            }
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': f'Failed to update session: {str(e)}'}), 500


@session_bp.route('/<int:session_id>', methods=['DELETE'])
@jwt_required()
def delete_session(session_id):
    """Delete a session (soft delete - set is_active to False)"""
    try:
        trainer_id = get_jwt_identity()
        
        session = TrainerSession.query.get(session_id)
        if not session:
            return jsonify({'error': 'Session not found'}), 404
        
        # Verify ownership
        if session.trainer_id != trainer_id:
            return jsonify({'error': 'Unauthorized'}), 403
        
        # Don't allow deleting if session has bookings
        if session.current_bookings > 0:
            return jsonify({'error': 'Cannot delete session with existing bookings'}), 400
        
        # Soft delete
        session.is_active = False
        db.session.commit()
        
        return jsonify({'message': 'Session deleted successfully'}), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': f'Failed to delete session: {str(e)}'}), 500


@session_bp.route('/<int:session_id>/bookings', methods=['GET'])
@jwt_required()
def get_session_bookings(session_id):
    """Get all bookings for a specific session"""
    try:
        trainer_id = get_jwt_identity()
        
        session = TrainerSession.query.get(session_id)
        if not session:
            return jsonify({'error': 'Session not found'}), 404
        
        # Verify ownership
        if session.trainer_id != trainer_id:
            return jsonify({'error': 'Unauthorized'}), 403
        
        bookings = Booking.query.filter_by(
            session_id=session_id,
            status='confirmed'
        ).all()
        
        return jsonify({
            'session': {
                'id': session.id,
                'class_type': session.class_type.name,
                'date': session.date.isoformat(),
                'start_time': session.start_time.strftime('%H:%M'),
                'end_time': session.end_time.strftime('%H:%M'),
                'current_bookings': session.current_bookings,
                'max_members': session.max_members
            },
            'bookings': [{
                'id': b.id,
                'member_id': b.member_id,
                'member_name': f"{b.member.first_name} {b.member.last_name}",
                'member_email': b.member.email,
                'booked_at': b.created_at.isoformat() if b.created_at else None
            } for b in bookings]
        }), 200
        
    except Exception as e:
        return jsonify({'error': f'Failed to fetch bookings: {str(e)}'}), 500


# ==================== CLASS TYPES ====================

@session_bp.route('/class-types', methods=['GET'])
@jwt_required()
def get_class_types():
    """Get all available class types"""
    try:
        class_types = ClassType.query.order_by(ClassType.name).all()
        
        return jsonify({
            'class_types': [{
                'id': ct.id,
                'name': ct.name,
                'description': ct.description,
                'created_at': ct.created_at.isoformat() if ct.created_at else None
            } for ct in class_types]
        }), 200
        
    except Exception as e:
        return jsonify({'error': f'Failed to fetch class types: {str(e)}'}), 500


@session_bp.route('/class-types', methods=['POST'])
@jwt_required()
def create_class_type():
    """
    Create a new class type (trainers only)
    Body: {
        "name": "HIIT Training",
        "description": "High-intensity interval training"
    }
    """
    try:
        trainer_id = get_jwt_identity()
        
        # Verify user is a trainer
        user = User.query.get(trainer_id)
        if not user or user.role != 'Trainer':
            return jsonify({'error': 'Unauthorized - Trainers only'}), 403
        
        data = request.get_json()
        
        # Validation
        if 'name' not in data or not data['name'].strip():
            return jsonify({'error': 'Name is required'}), 400
        
        # Check if class type already exists
        existing = ClassType.query.filter_by(name=data['name'].strip()).first()
        if existing:
            return jsonify({'error': 'A class type with this name already exists'}), 409
        
        # Create class type
        new_class_type = ClassType(
            name=data['name'].strip(),
            description=data.get('description', '').strip()
        )
        
        db.session.add(new_class_type)
        db.session.commit()
        
        return jsonify({
            'message': 'Class type created successfully',
            'class_type': {
                'id': new_class_type.id,
                'name': new_class_type.name,
                'description': new_class_type.description
            }
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': f'Failed to create class type: {str(e)}'}), 500


@session_bp.route('/class-types/<int:class_type_id>', methods=['PUT'])
@jwt_required()
def update_class_type(class_type_id):
    """
    Update a class type (trainers only)
    Body: {
        "name": "Updated Name",
        "description": "Updated description"
    }
    """
    try:
        trainer_id = get_jwt_identity()
        
        # Verify user is a trainer
        user = User.query.get(trainer_id)
        if not user or user.role != 'Trainer':
            return jsonify({'error': 'Unauthorized - Trainers only'}), 403
        
        class_type = ClassType.query.get(class_type_id)
        if not class_type:
            return jsonify({'error': 'Class type not found'}), 404
        
        data = request.get_json()
        
        # Update name if provided
        if 'name' in data:
            new_name = data['name'].strip()
            if not new_name:
                return jsonify({'error': 'Name cannot be empty'}), 400
            
            # Check if new name already exists (excluding current class type)
            existing = ClassType.query.filter(
                ClassType.name == new_name,
                ClassType.id != class_type_id
            ).first()
            
            if existing:
                return jsonify({'error': 'A class type with this name already exists'}), 409
            
            class_type.name = new_name
        
        # Update description if provided
        if 'description' in data:
            class_type.description = data['description'].strip()
        
        db.session.commit()
        
        return jsonify({
            'message': 'Class type updated successfully',
            'class_type': {
                'id': class_type.id,
                'name': class_type.name,
                'description': class_type.description
            }
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': f'Failed to update class type: {str(e)}'}), 500


@session_bp.route('/class-types/<int:class_type_id>', methods=['DELETE'])
@jwt_required()
def delete_class_type(class_type_id):
    """Delete a class type (trainers only) - only if no sessions use it"""
    try:
        trainer_id = get_jwt_identity()
        
        # Verify user is a trainer
        user = User.query.get(trainer_id)
        if not user or user.role != 'Trainer':
            return jsonify({'error': 'Unauthorized - Trainers only'}), 403
        
        class_type = ClassType.query.get(class_type_id)
        if not class_type:
            return jsonify({'error': 'Class type not found'}), 404
        
        # Check if any sessions use this class type
        sessions_count = TrainerSession.query.filter_by(
            class_type_id=class_type_id,
            is_active=True
        ).count()
        
        if sessions_count > 0:
            return jsonify({
                'error': f'Cannot delete class type. {sessions_count} active session(s) are using it.'
            }), 400
        
        db.session.delete(class_type)
        db.session.commit()
        
        return jsonify({'message': 'Class type deleted successfully'}), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': f'Failed to delete class type: {str(e)}'}), 500