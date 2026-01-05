from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from datetime import datetime, timedelta
from sqlalchemy import and_, or_, func

# Import your models
from models import (
    db, User, Trainer, TrainerSession, Booking, 
    ClassType, Notification
)

bookings_bp = Blueprint('bookings', __name__, url_prefix='/api/bookings')


# Helper function to check if current user is admin
def check_admin_role(user_id):
    """Check if user has admin role"""
    user = User.query.get(user_id)
    if not user or user.role != 'Admin':
        return False
    return True


# ============= DASHBOARD & OVERVIEW =============
@bookings_bp.route('/dashboard', methods=['GET'])
@jwt_required()
def get_booking_dashboard():
    """Get booking management dashboard with stats and overview"""
    current_user_id = get_jwt_identity()
    
    if not check_admin_role(current_user_id):
        return jsonify({'error': 'Admin access required'}), 403
    
    today = datetime.now().date()
    
    # Get statistics
    total_sessions = TrainerSession.query.filter_by(is_active=True).count()
    today_sessions = TrainerSession.query.filter(
        TrainerSession.date == today,
        TrainerSession.is_active == True
    ).count()
    
    total_bookings = Booking.query.filter_by(status='confirmed').count()
    upcoming_sessions = TrainerSession.query.filter(
        TrainerSession.date >= today,
        TrainerSession.is_active == True
    ).count()
    
    completed_bookings = Booking.query.filter_by(status='completed').count()
    cancelled_bookings = Booking.query.filter_by(status='cancelled').count()
    
    # Revenue calculation
    total_revenue = db.session.query(
        func.sum(TrainerSession.price * Booking.id)
    ).join(
        Booking, TrainerSession.id == Booking.session_id
    ).filter(
        Booking.status == 'completed'
    ).scalar() or 0
    
    return jsonify({
        'stats': {
            'total_sessions': total_sessions,
            'today_sessions': today_sessions,
            'upcoming_sessions': upcoming_sessions,
            'total_bookings': total_bookings,
            'completed_bookings': completed_bookings,
            'cancelled_bookings': cancelled_bookings,
            'total_revenue': float(total_revenue)
        }
    }), 200


@bookings_bp.route('/recent', methods=['GET'])
@jwt_required()
def get_recent_bookings():
    """Get recent bookings with full details"""
    current_user_id = get_jwt_identity()
    
    if not check_admin_role(current_user_id):
        return jsonify({'error': 'Admin access required'}), 403
    
    limit = request.args.get('limit', 20, type=int)
    
    bookings = db.session.query(
        Booking, TrainerSession, User, ClassType
    ).join(
        TrainerSession, Booking.session_id == TrainerSession.id
    ).join(
        User, Booking.member_id == User.user_id
    ).join(
        ClassType, TrainerSession.class_type_id == ClassType.id
    ).order_by(
        Booking.created_at.desc()
    ).limit(limit).all()
    
    result = []
    for booking, session, member, class_type in bookings:
        trainer = User.query.get(session.trainer_id)
        result.append({
            'booking_id': booking.id,
            'status': booking.status,
            'created_at': booking.created_at.isoformat(),
            'member': {
                'id': member.user_id,
                'name': f"{member.first_name} {member.last_name}",
                'email': member.email
            },
            'session': {
                'id': session.id,
                'date': session.date.isoformat(),
                'start_time': session.start_time.strftime('%H:%M'),
                'end_time': session.end_time.strftime('%H:%M'),
                'price': float(session.price),
                'class_type': class_type.name
            },
            'trainer': {
                'id': trainer.user_id,
                'name': f"{trainer.first_name} {trainer.last_name}"
            }
        })
    
    return jsonify({'bookings': result}), 200


# ============= SESSIONS MANAGEMENT =============
@bookings_bp.route('/sessions', methods=['GET'])
@jwt_required()
def get_all_sessions():
    """Get all training sessions with filters"""
    current_user_id = get_jwt_identity()
    
    if not check_admin_role(current_user_id):
        return jsonify({'error': 'Admin access required'}), 403
    
    # Filters
    date_from = request.args.get('date_from')
    date_to = request.args.get('date_to')
    trainer_id = request.args.get('trainer_id')
    class_type_id = request.args.get('class_type_id', type=int)
    is_active = request.args.get('is_active', type=bool)
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 20, type=int)
    
    query = db.session.query(
        TrainerSession, User, ClassType
    ).join(
        User, TrainerSession.trainer_id == User.user_id
    ).join(
        ClassType, TrainerSession.class_type_id == ClassType.id
    )
    
    # Apply filters
    if date_from:
        query = query.filter(TrainerSession.date >= datetime.strptime(date_from, '%Y-%m-%d').date())
    if date_to:
        query = query.filter(TrainerSession.date <= datetime.strptime(date_to, '%Y-%m-%d').date())
    if trainer_id:
        query = query.filter(TrainerSession.trainer_id == trainer_id)
    if class_type_id:
        query = query.filter(TrainerSession.class_type_id == class_type_id)
    if is_active is not None:
        query = query.filter(TrainerSession.is_active == is_active)
    
    query = query.order_by(TrainerSession.date.desc(), TrainerSession.start_time.desc())
    
    # Pagination
    paginated = query.paginate(page=page, per_page=per_page, error_out=False)
    
    result = []
    for session, trainer, class_type in paginated.items:
        result.append({
            'id': session.id,
            'date': session.date.isoformat(),
            'start_time': session.start_time.strftime('%H:%M'),
            'end_time': session.end_time.strftime('%H:%M'),
            'price': float(session.price),
            'max_members': session.max_members,
            'current_bookings': session.current_bookings,
            'spots_remaining': session.spots_remaining,
            'is_full': session.is_full,
            'is_active': session.is_active,
            'created_at': session.created_at.isoformat(),
            'trainer': {
                'id': trainer.user_id,
                'name': f"{trainer.first_name} {trainer.last_name}",
                'email': trainer.email
            },
            'class_type': {
                'id': class_type.id,
                'name': class_type.name,
                'description': class_type.description
            }
        })
    
    return jsonify({
        'sessions': result,
        'pagination': {
            'page': page,
            'per_page': per_page,
            'total': paginated.total,
            'pages': paginated.pages
        }
    }), 200


@bookings_bp.route('/sessions/<int:session_id>', methods=['GET'])
@jwt_required()
def get_session_details(session_id):
    """Get detailed information about a specific session"""
    current_user_id = get_jwt_identity()
    
    if not check_admin_role(current_user_id):
        return jsonify({'error': 'Admin access required'}), 403
    
    session = TrainerSession.query.get_or_404(session_id)
    trainer = User.query.get(session.trainer_id)
    class_type = ClassType.query.get(session.class_type_id)
    
    # Get all bookings for this session
    bookings = db.session.query(Booking, User).join(
        User, Booking.member_id == User.user_id
    ).filter(
        Booking.session_id == session_id
    ).all()
    
    members_list = []
    for booking, member in bookings:
        members_list.append({
            'booking_id': booking.id,
            'status': booking.status,
            'member': {
                'id': member.user_id,
                'name': f"{member.first_name} {member.last_name}",
                'email': member.email,
                'phone': member.phone
            },
            'booked_at': booking.created_at.isoformat()
        })
    
    return jsonify({
        'session': {
            'id': session.id,
            'date': session.date.isoformat(),
            'start_time': session.start_time.strftime('%H:%M'),
            'end_time': session.end_time.strftime('%H:%M'),
            'price': float(session.price),
            'max_members': session.max_members,
            'current_bookings': session.current_bookings,
            'spots_remaining': session.spots_remaining,
            'is_full': session.is_full,
            'is_active': session.is_active,
            'created_at': session.created_at.isoformat(),
            'trainer': {
                'id': trainer.user_id,
                'name': f"{trainer.first_name} {trainer.last_name}",
                'email': trainer.email,
                'phone': trainer.phone
            },
            'class_type': {
                'id': class_type.id,
                'name': class_type.name,
                'description': class_type.description
            },
            'bookings': members_list
        }
    }), 200


@bookings_bp.route('/sessions/<int:session_id>', methods=['DELETE'])
@jwt_required()
def delete_session(session_id):
    """Delete a training session (admin only)"""
    current_user_id = get_jwt_identity()
    
    if not check_admin_role(current_user_id):
        return jsonify({'error': 'Admin access required'}), 403
    
    session = TrainerSession.query.get_or_404(session_id)
    
    # Check if there are any bookings
    bookings_count = Booking.query.filter_by(
        session_id=session_id, 
        status='confirmed'
    ).count()
    
    if bookings_count > 0:
        force = request.args.get('force', 'false').lower() == 'true'
        if not force:
            return jsonify({
                'error': 'Cannot delete session with active bookings',
                'bookings_count': bookings_count,
                'hint': 'Use ?force=true to cancel all bookings and delete'
            }), 400
        
        # Cancel all bookings and notify members
        bookings = Booking.query.filter_by(
            session_id=session_id,
            status='confirmed'
        ).all()
        
        for booking in bookings:
            booking.status = 'cancelled'
            
            # Create notification for member
            notification = Notification(
                user_id=booking.member_id,
                message=f"Your booking for {session.date} at {session.start_time.strftime('%H:%M')} has been cancelled by admin.",
                link=f"/bookings/{booking.id}"
            )
            db.session.add(notification)
    
    # Delete the session
    db.session.delete(session)
    db.session.commit()
    
    return jsonify({
        'message': 'Session deleted successfully',
        'cancelled_bookings': bookings_count if bookings_count > 0 else 0
    }), 200


@bookings_bp.route('/sessions/<int:session_id>/toggle', methods=['PATCH'])
@jwt_required()
def toggle_session_status(session_id):
    """Activate or deactivate a session"""
    current_user_id = get_jwt_identity()
    
    if not check_admin_role(current_user_id):
        return jsonify({'error': 'Admin access required'}), 403
    
    session = TrainerSession.query.get_or_404(session_id)
    session.is_active = not session.is_active
    db.session.commit()
    
    return jsonify({
        'message': f"Session {'activated' if session.is_active else 'deactivated'} successfully",
        'is_active': session.is_active
    }), 200


# ============= BOOKINGS MANAGEMENT =============
@bookings_bp.route('/all', methods=['GET'])
@jwt_required()
def get_all_bookings():
    """Get all bookings with filters"""
    current_user_id = get_jwt_identity()
    
    if not check_admin_role(current_user_id):
        return jsonify({'error': 'Admin access required'}), 403
    
    # Filters
    status = request.args.get('status')
    member_id = request.args.get('member_id')
    trainer_id = request.args.get('trainer_id')
    date_from = request.args.get('date_from')
    date_to = request.args.get('date_to')
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 20, type=int)
    
    query = db.session.query(
        Booking, TrainerSession, User, ClassType
    ).join(
        TrainerSession, Booking.session_id == TrainerSession.id
    ).join(
        User, Booking.member_id == User.user_id
    ).join(
        ClassType, TrainerSession.class_type_id == ClassType.id
    )
    
    # Apply filters
    if status:
        query = query.filter(Booking.status == status)
    if member_id:
        query = query.filter(Booking.member_id == member_id)
    if trainer_id:
        query = query.filter(TrainerSession.trainer_id == trainer_id)
    if date_from:
        query = query.filter(TrainerSession.date >= datetime.strptime(date_from, '%Y-%m-%d').date())
    if date_to:
        query = query.filter(TrainerSession.date <= datetime.strptime(date_to, '%Y-%m-%d').date())
    
    query = query.order_by(Booking.created_at.desc())
    
    # Pagination
    paginated = query.paginate(page=page, per_page=per_page, error_out=False)
    
    result = []
    for booking, session, member, class_type in paginated.items:
        trainer = User.query.get(session.trainer_id)
        result.append({
            'booking_id': booking.id,
            'status': booking.status,
            'created_at': booking.created_at.isoformat(),
            'updated_at': booking.updated_at.isoformat() if booking.updated_at else None,
            'member': {
                'id': member.user_id,
                'name': f"{member.first_name} {member.last_name}",
                'email': member.email
            },
            'session': {
                'id': session.id,
                'date': session.date.isoformat(),
                'start_time': session.start_time.strftime('%H:%M'),
                'end_time': session.end_time.strftime('%H:%M'),
                'price': float(session.price),
                'class_type': class_type.name
            },
            'trainer': {
                'id': trainer.user_id,
                'name': f"{trainer.first_name} {trainer.last_name}"
            }
        })
    
    return jsonify({
        'bookings': result,
        'pagination': {
            'page': page,
            'per_page': per_page,
            'total': paginated.total,
            'pages': paginated.pages
        }
    }), 200


@bookings_bp.route('/<int:booking_id>', methods=['GET'])
@jwt_required()
def get_booking_details(booking_id):
    """Get detailed information about a specific booking"""
    current_user_id = get_jwt_identity()
    
    if not check_admin_role(current_user_id):
        return jsonify({'error': 'Admin access required'}), 403
    
    booking = Booking.query.get_or_404(booking_id)
    session = TrainerSession.query.get(booking.session_id)
    member = User.query.get(booking.member_id)
    trainer = User.query.get(session.trainer_id)
    class_type = ClassType.query.get(session.class_type_id)
    
    return jsonify({
        'booking': {
            'id': booking.id,
            'status': booking.status,
            'created_at': booking.created_at.isoformat(),
            'updated_at': booking.updated_at.isoformat() if booking.updated_at else None,
            'member': {
                'id': member.user_id,
                'name': f"{member.first_name} {member.last_name}",
                'email': member.email,
                'phone': member.phone
            },
            'session': {
                'id': session.id,
                'date': session.date.isoformat(),
                'start_time': session.start_time.strftime('%H:%M'),
                'end_time': session.end_time.strftime('%H:%M'),
                'price': float(session.price),
                'class_type': {
                    'id': class_type.id,
                    'name': class_type.name,
                    'description': class_type.description
                }
            },
            'trainer': {
                'id': trainer.user_id,
                'name': f"{trainer.first_name} {trainer.last_name}",
                'email': trainer.email,
                'phone': trainer.phone
            }
        }
    }), 200


@bookings_bp.route('/<int:booking_id>/cancel', methods=['PATCH'])
@jwt_required()
def cancel_booking(booking_id):
    """Cancel a booking (admin override)"""
    current_user_id = get_jwt_identity()
    
    if not check_admin_role(current_user_id):
        return jsonify({'error': 'Admin access required'}), 403
    
    booking = Booking.query.get_or_404(booking_id)
    
    if booking.status == 'cancelled':
        return jsonify({'error': 'Booking is already cancelled'}), 400
    
    booking.status = 'cancelled'
    booking.updated_at = datetime.utcnow()
    
    # Update session bookings count
    session = TrainerSession.query.get(booking.session_id)
    if session.current_bookings > 0:
        session.current_bookings -= 1
    
    # Notify member
    notification = Notification(
        user_id=booking.member_id,
        message=f"Your booking for {session.date} at {session.start_time.strftime('%H:%M')} has been cancelled by admin.",
        link=f"/bookings/{booking.id}"
    )
    db.session.add(notification)
    
    db.session.commit()
    
    return jsonify({
        'message': 'Booking cancelled successfully',
        'booking_id': booking_id,
        'status': booking.status
    }), 200


@bookings_bp.route('/<int:booking_id>/complete', methods=['PATCH'])
@jwt_required()
def complete_booking(booking_id):
    """Mark a booking as completed"""
    current_user_id = get_jwt_identity()
    
    if not check_admin_role(current_user_id):
        return jsonify({'error': 'Admin access required'}), 403
    
    booking = Booking.query.get_or_404(booking_id)
    
    if booking.status == 'completed':
        return jsonify({'error': 'Booking is already completed'}), 400
    
    booking.status = 'completed'
    booking.updated_at = datetime.utcnow()
    db.session.commit()
    
    return jsonify({
        'message': 'Booking marked as completed',
        'booking_id': booking_id,
        'status': booking.status
    }), 200


@bookings_bp.route('/<int:booking_id>', methods=['DELETE'])
@jwt_required()
def delete_booking(booking_id):
    """Delete a booking permanently"""
    current_user_id = get_jwt_identity()
    
    if not check_admin_role(current_user_id):
        return jsonify({'error': 'Admin access required'}), 403
    
    booking = Booking.query.get_or_404(booking_id)
    
    # Update session bookings count if booking was confirmed
    if booking.status == 'confirmed':
        session = TrainerSession.query.get(booking.session_id)
        if session.current_bookings > 0:
            session.current_bookings -= 1
    
    db.session.delete(booking)
    db.session.commit()
    
    return jsonify({
        'message': 'Booking deleted successfully',
        'booking_id': booking_id
    }), 200


# ============= TRAINER ANALYTICS =============
@bookings_bp.route('/trainers/<string:trainer_id>/stats', methods=['GET'])
@jwt_required()
def get_trainer_stats(trainer_id):
    """Get booking statistics for a specific trainer"""
    current_user_id = get_jwt_identity()
    
    if not check_admin_role(current_user_id):
        return jsonify({'error': 'Admin access required'}), 403
    
    # Verify trainer exists
    trainer = User.query.filter_by(user_id=trainer_id, role='Trainer').first_or_404()
    
    # Total sessions
    total_sessions = TrainerSession.query.filter_by(trainer_id=trainer_id).count()
    active_sessions = TrainerSession.query.filter_by(
        trainer_id=trainer_id, 
        is_active=True
    ).count()
    
    # Total bookings
    total_bookings = db.session.query(func.count(Booking.id)).join(
        TrainerSession, Booking.session_id == TrainerSession.id
    ).filter(
        TrainerSession.trainer_id == trainer_id
    ).scalar()
    
    # Completed bookings
    completed_bookings = db.session.query(func.count(Booking.id)).join(
        TrainerSession, Booking.session_id == TrainerSession.id
    ).filter(
        TrainerSession.trainer_id == trainer_id,
        Booking.status == 'completed'
    ).scalar()
    
    # Revenue
    revenue = db.session.query(func.sum(TrainerSession.price)).join(
        Booking, TrainerSession.id == Booking.session_id
    ).filter(
        TrainerSession.trainer_id == trainer_id,
        Booking.status == 'completed'
    ).scalar() or 0
    
    # Average rating (if you have a rating system)
    avg_attendance = (completed_bookings / total_bookings * 100) if total_bookings > 0 else 0
    
    return jsonify({
        'trainer': {
            'id': trainer.user_id,
            'name': f"{trainer.first_name} {trainer.last_name}",
            'email': trainer.email
        },
        'stats': {
            'total_sessions': total_sessions,
            'active_sessions': active_sessions,
            'total_bookings': total_bookings,
            'completed_bookings': completed_bookings,
            'cancelled_bookings': total_bookings - completed_bookings,
            'revenue': float(revenue),
            'average_attendance_rate': round(avg_attendance, 2)
        }
    }), 200


# ============= SEARCH & FILTERS =============
@bookings_bp.route('/search', methods=['GET'])
@jwt_required()
def search_bookings():
    """Advanced search for bookings and sessions"""
    current_user_id = get_jwt_identity()
    
    if not check_admin_role(current_user_id):
        return jsonify({'error': 'Admin access required'}), 403
    
    query_text = request.args.get('q', '')
    search_type = request.args.get('type', 'all')  # all, sessions, bookings
    
    results = {'sessions': [], 'bookings': []}
    
    if search_type in ['all', 'sessions']:
        # Search sessions by class type or trainer name
        sessions = db.session.query(
            TrainerSession, User, ClassType
        ).join(
            User, TrainerSession.trainer_id == User.user_id
        ).join(
            ClassType, TrainerSession.class_type_id == ClassType.id
        ).filter(
            or_(
                ClassType.name.ilike(f'%{query_text}%'),
                User.first_name.ilike(f'%{query_text}%'),
                User.last_name.ilike(f'%{query_text}%')
            )
        ).limit(20).all()
        
        for session, trainer, class_type in sessions:
            results['sessions'].append({
                'id': session.id,
                'date': session.date.isoformat(),
                'time': f"{session.start_time.strftime('%H:%M')} - {session.end_time.strftime('%H:%M')}",
                'trainer': f"{trainer.first_name} {trainer.last_name}",
                'class_type': class_type.name,
                'price': float(session.price)
            })
    
    if search_type in ['all', 'bookings']:
        # Search bookings by member name or email
        bookings = db.session.query(
            Booking, User, TrainerSession
        ).join(
            User, Booking.member_id == User.user_id
        ).join(
            TrainerSession, Booking.session_id == TrainerSession.id
        ).filter(
            or_(
                User.first_name.ilike(f'%{query_text}%'),
                User.last_name.ilike(f'%{query_text}%'),
                User.email.ilike(f'%{query_text}%')
            )
        ).limit(20).all()
        
        for booking, member, session in bookings:
            results['bookings'].append({
                'booking_id': booking.id,
                'member': f"{member.first_name} {member.last_name}",
                'email': member.email,
                'session_date': session.date.isoformat(),
                'status': booking.status
            })
    
    return jsonify(results), 200