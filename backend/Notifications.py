"""
Notification utility functions for the gym management system.
Import and use these functions in any blueprint to create notifications.
"""
from models import db, Notification
from datetime import datetime


def create_notification(user_id, message, link):
    """
    Create a notification for a user.
    
    Args:
        user_id (str): The UUID of the user
        message (str): The notification message
    
    Returns:
        Notification: The created notification object, or None if failed
    """
    try:
        notification = Notification(
            user_id=user_id,
            message=message,
            is_read=False,
            link=link
        )
        db.session.add(notification)
        db.session.commit()
        return notification
    except Exception as e:
        db.session.rollback()
        print(f"Error creating notification: {e}")
        return None


def get_user_notifications(user_id, unread_only=False, limit=None):
    """
    Get notifications for a user.
    
    Args:
        user_id (str): The UUID of the user
        unread_only (bool): If True, only return unread notifications
        limit (int): Maximum number of notifications to return
    
    Returns:
        list: List of Notification objects
    """
    query = Notification.query.filter_by(user_id=user_id)
    
    if unread_only:
        query = query.filter_by(is_read=False)
    
    query = query.order_by(Notification.created_at.desc())
    
    if limit:
        query = query.limit(limit)
    
    return query.all()


def mark_as_read(notification_id):
    """
    Mark a notification as read.
    
    Args:
        notification_id (int): The ID of the notification
    
    Returns:
        bool: True if successful, False otherwise
    """
    try:
        notification = Notification.query.get(notification_id)
        if notification:
            notification.is_read = True
            db.session.commit()
            return True
        return False
    except Exception as e:
        db.session.rollback()
        print(f"Error marking notification as read: {e}")
        return False


def mark_all_as_read(user_id):
    """
    Mark all notifications as read for a user.
    
    Args:
        user_id (str): The UUID of the user
    
    Returns:
        int: Number of notifications marked as read
    """
    try:
        count = Notification.query.filter_by(
            user_id=user_id, 
            is_read=False
        ).update({'is_read': True})
        db.session.commit()
        return count
    except Exception as e:
        db.session.rollback()
        print(f"Error marking all notifications as read: {e}")
        return 0


def get_unread_count(user_id):
    """
    Get the count of unread notifications for a user.
    
    Args:
        user_id (str): The UUID of the user
    
    Returns:
        int: Count of unread notifications
    """
    return Notification.query.filter_by(
        user_id=user_id, 
        is_read=False
    ).count()


# Pre-defined notification templates for common scenarios
# Member Notifications
def notify_booking_confirmed(user_id, session_date, session_time, class_name):
    """Create notification for booking confirmation"""
    message = f"Your booking for {class_name} on {session_date} at {session_time} has been confirmed! Don't be late."
    link = "/member/dashboard/bookings"
    return create_notification(user_id, message, link)


def notify_booking_cancelled(user_id, session_date, class_name):
    """Create notification for booking cancellation"""
    message = f"Your booking for {class_name} on {session_date} has been cancelled. Sorry dude!"
    link = "/member/dashboard/bookings"
    return create_notification(user_id, message, link)


def notify_order_placed(user_id, order_id, total_price):
    """Create notification for order placement"""
    message = f"Your order #{order_id} has been placed successfully! Total: ${total_price:.2f}"
    link = ""
    return create_notification(user_id, message, link)


def notify_session_reminder(user_id, class_name, session_time):
    """Create notification for upcoming session reminder"""
    message = f"Reminder: Your {class_name} session starts at {session_time}! Get ready!"
    link = "/member/dashboard/bookings"
    return create_notification(user_id, message, link)


def notify_membership_expiring(user_id, days_remaining):
    """Create notification for membership expiry"""
    message = f"Your membership expires in {days_remaining} days. Bro c'mon it's only couple bucks!"
    link = "/member/dashboard/membership"
    return create_notification(user_id, message, link)


def notify_session_cancelled(user_id, class_name, session_date):
    """Create notification when trainer cancels a session"""
    message = f"The {class_name} session scheduled for {session_date} has been cancelled by the trainer. Let me find you another one."
    link = "/member/dashboard/classes"
    return create_notification(user_id, message, link)

# Trainer Notifications
def notify_new_booking(trainer_id, class_name, session_date, member_username):
    """Create notification for new booking"""
    message = f"{member_username} has booked your {class_name} session on {session_date}."
    link = "/trainer/dashboard/my-classes"
    return create_notification(trainer_id, message, link)

def notify_session_cancelled_by_member(trainer_id, class_name, session_date):
    """Create notification when a member cancels a booking"""
    message = f"A member has cancelled their booking for your {class_name} session on {session_date}."
    link = "/trainer/dashboard/my-classes"
    return create_notification(trainer_id, message, link)

def notify_admin_new_trainer_application(admin_id, trainer_name):
    """Create notification for new trainer application"""
    message = f"New trainer application received from {trainer_name}."
    link = "/admin/dashboard/trainer-management"
    return create_notification(admin_id, message, link)


