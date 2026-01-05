from flask import Blueprint, jsonify, request
from models import db, Notification
from flask_jwt_extended import jwt_required, get_jwt_identity
from Notifications import (
    get_user_notifications,
    mark_as_read,
    mark_all_as_read,
    get_unread_count
)

notifications_bp = Blueprint('notifications', __name__, url_prefix='/api/notifications')


@notifications_bp.route('/', methods=['GET'])
@jwt_required()
def get_notifications():
    """Get all notifications for current user"""
    try:
        unread_only = request.args.get('unread_only', 'false').lower() == 'true'
        limit = request.args.get('limit', type=int)

        current_user = get_jwt_identity()

        notifications = get_user_notifications(
            user_id=current_user,
            unread_only=unread_only,
            limit=limit
        )
        
        return jsonify({
            'success': True,
            'notifications': [{
                'id': n.id,
                'message': n.message,
                'link': n.link,
                'is_read': n.is_read,
                'created_at': n.created_at.isoformat()
            } for n in notifications]
        }), 200
        
    except Exception as e:
        return jsonify({
            'success': False,
            'message': str(e)
        }), 500


@notifications_bp.route('/unread-count', methods=['GET'])
@jwt_required()
def unread_count():
    """Get count of unread notifications"""
    try:
        current_user = get_jwt_identity()

        count = get_unread_count(current_user)
        return jsonify({
            'success': True,
            'count': count
        }), 200
    except Exception as e:
        return jsonify({
            'success': False,
            'message': str(e)
        }), 500


@notifications_bp.route('/<int:notification_id>/read', methods=['PUT'])
@jwt_required()
def mark_notification_read(notification_id):
    """Mark a single notification as read"""
    try:
        current_user = get_jwt_identity()

        # Verify notification belongs to current user
        notification = Notification.query.get(notification_id)
        if not notification:
            return jsonify({
                'success': False,
                'message': 'Notification not found'
            }), 404
        
        if notification.user_id != current_user:
            return jsonify({
                'success': False,
                'message': 'Unauthorized'
            }), 403
        
        success = mark_as_read(notification_id)
        
        if success:
            return jsonify({
                'success': True,
                'message': 'Notification marked as read'
            }), 200
        else:
            return jsonify({
                'success': False,
                'message': 'Failed to mark notification as read'
            }), 500
            
    except Exception as e:
        return jsonify({
            'success': False,
            'message': str(e)
        }), 500


@notifications_bp.route('/mark-all-read', methods=['PUT'])
@jwt_required()
def mark_all_notifications_read():
    """Mark all notifications as read for current user"""
    try:
        current_user = get_jwt_identity()

        count = mark_all_as_read(current_user)
        return jsonify({
            'success': True,
            'message': f'{count} notifications marked as read',
            'count': count
        }), 200
    except Exception as e:
        return jsonify({
            'success': False,
            'message': str(e)
        }), 500


@notifications_bp.route('/<int:notification_id>', methods=['DELETE'])
@jwt_required()
def delete_notification(notification_id):
    """Delete a notification"""
    try:
        current_user = get_jwt_identity()

        notification = Notification.query.get(notification_id)
        if not notification:
            return jsonify({
                'success': False,
                'message': 'Notification not found'
            }), 404
            
        if notification.user_id != current_user:
            return jsonify({
                'success': False,
                'message': 'Unauthorized'
            }), 403
        
        db.session.delete(notification)
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': 'Notification deleted'
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({
            'success': False,
            'message': str(e)
        }), 500