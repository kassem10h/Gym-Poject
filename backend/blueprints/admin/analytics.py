from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from sqlalchemy import func, desc, and_, or_, extract, case
from datetime import datetime, timedelta, date
from models import (
    db, User, Order, OrderItem, Products, ProductCategory, 
    Booking, TrainerSession, Membership, Trainer,
    Equipments, ProductRating
)
import csv
from io import StringIO
from flask import Response

analytics_bp = Blueprint('analytics', __name__, url_prefix='/api/analytics')

# Helper function to check if current user is admin
def check_admin_role(user_id):
    """Check if user has admin role"""
    user = User.query.get(user_id)
    if not user or user.role != 'Admin':
        return False
    return True


@analytics_bp.route('/dashboard', methods=['GET'])
@jwt_required()
def get_dashboard_overview():
    """Get complete dashboard overview with all key metrics"""
    try:
        current_user_id = get_jwt_identity()
        if not check_admin_role(current_user_id):
            return jsonify({'error': 'Admin access required'}), 403

        days = request.args.get('days', 30, type=int)
        start_date = datetime.utcnow() - timedelta(days=days)
        
        # === USER METRICS ===
        total_users = User.query.count()
        new_users = User.query.filter(User.created_at >= start_date).count()
        active_members = User.query.filter(
            and_(User.role == 'Member', User.is_active == True)
        ).count()
        total_trainers = User.query.filter(User.role == 'Trainer').count()
        
        # === REVENUE METRICS ===
        total_revenue = db.session.query(func.sum(Order.total_price)).scalar() or 0
        recent_revenue = db.session.query(func.sum(Order.total_price))\
            .filter(Order.created_at >= start_date).scalar() or 0
        
        # Booking revenue
        booking_revenue = db.session.query(func.sum(TrainerSession.price))\
            .join(Booking)\
            .filter(Booking.created_at >= start_date)\
            .filter(Booking.status == 'confirmed').scalar() or 0
        
        # === ORDER METRICS ===
        total_orders = Order.query.count()
        recent_orders = Order.query.filter(Order.created_at >= start_date).count()
        avg_order_value = db.session.query(func.avg(Order.total_price)).scalar() or 0
        
        # === BOOKING METRICS ===
        total_bookings = Booking.query.count()
        recent_bookings = Booking.query.filter(Booking.created_at >= start_date).count()
        confirmed_bookings = Booking.query.filter(
            and_(Booking.created_at >= start_date, Booking.status == 'confirmed')
        ).count()
        cancelled_bookings = Booking.query.filter(
            and_(Booking.created_at >= start_date, Booking.status == 'cancelled')
        ).count()
        
        # === MEMBERSHIP METRICS ===
        active_memberships = Membership.query.filter(Membership.is_active == True).count()
        expiring_soon = Membership.query.filter(
            and_(
                Membership.is_active == True,
                Membership.end_date <= date.today() + timedelta(days=7)
            )
        ).count()
        
        # === PRODUCT METRICS ===
        total_products = Products.query.filter(Products.is_active == True).count()
        total_equipment = Equipments.query.filter(Equipments.is_active == True).count()
        products_sold = db.session.query(func.sum(OrderItem.quantity))\
            .join(Order)\
            .filter(Order.created_at >= start_date).scalar() or 0
        
        # === GROWTH CALCULATIONS ===
        # Compare with previous period
        previous_start = start_date - timedelta(days=days)
        previous_revenue = db.session.query(func.sum(Order.total_price))\
            .filter(and_(Order.created_at >= previous_start, Order.created_at < start_date))\
            .scalar() or 0
        
        revenue_growth = 0
        if previous_revenue > 0:
            revenue_growth = ((recent_revenue - previous_revenue) / previous_revenue) * 100
        
        previous_orders = Order.query.filter(
            and_(Order.created_at >= previous_start, Order.created_at < start_date)
        ).count()
        
        order_growth = 0
        if previous_orders > 0:
            order_growth = ((recent_orders - previous_orders) / previous_orders) * 100
        
        return jsonify({
            'period_days': days,
            'users': {
                'total': total_users,
                'new_users': new_users,
                'active_members': active_members,
                'trainers': total_trainers
            },
            'revenue': {
                'total': float(total_revenue),
                'recent': float(recent_revenue),
                'booking_revenue': float(booking_revenue),
                'growth_percentage': round(revenue_growth, 2)
            },
            'orders': {
                'total': total_orders,
                'recent': recent_orders,
                'avg_value': float(avg_order_value),
                'growth_percentage': round(order_growth, 2)
            },
            'bookings': {
                'total': total_bookings,
                'recent': recent_bookings,
                'confirmed': confirmed_bookings,
                'cancelled': cancelled_bookings,
                'cancellation_rate': round((cancelled_bookings / recent_bookings * 100) if recent_bookings > 0 else 0, 2)
            },
            'memberships': {
                'active': active_memberships,
                'expiring_soon': expiring_soon
            },
            'inventory': {
                'products': total_products,
                'equipment': total_equipment,
                'products_sold': int(products_sold)
            }
        }), 200

    except Exception as e:
        return jsonify({'error': f'Failed to fetch dashboard: {str(e)}'}), 500


@analytics_bp.route('/revenue/trends', methods=['GET'])
@jwt_required()
def get_revenue_trends():
    """Get detailed revenue trends with multiple data sources"""
    try:
        current_user_id = get_jwt_identity()
        if not check_admin_role(current_user_id):
            return jsonify({'error': 'Admin access required'}), 403

        period = request.args.get('period', 'daily')  # daily, weekly, monthly
        days = request.args.get('days', 30, type=int)
        start_date = datetime.utcnow() - timedelta(days=days)
        
        if period == 'daily':
            # Daily revenue from orders
            order_revenue = db.session.query(
                func.date(Order.created_at).label('date'),
                func.sum(Order.total_price).label('revenue'),
                func.count(Order.id).label('count')
            ).filter(Order.created_at >= start_date)\
            .group_by(func.date(Order.created_at))\
            .order_by('date').all()
            
            # Daily revenue from bookings
            booking_revenue = db.session.query(
                func.date(Booking.created_at).label('date'),
                func.sum(TrainerSession.price).label('revenue'),
                func.count(Booking.id).label('count')
            ).join(TrainerSession)\
            .filter(Booking.created_at >= start_date)\
            .filter(Booking.status == 'confirmed')\
            .group_by(func.date(Booking.created_at))\
            .order_by('date').all()
            
            # Combine data
            revenue_dict = {}
            for row in order_revenue:
                date_str = row.date.isoformat()
                revenue_dict[date_str] = {
                    'date': date_str,
                    'order_revenue': float(row.revenue),
                    'order_count': int(row.count),
                    'booking_revenue': 0,
                    'booking_count': 0
                }
            
            for row in booking_revenue:
                date_str = row.date.isoformat()
                if date_str in revenue_dict:
                    revenue_dict[date_str]['booking_revenue'] = float(row.revenue)
                    revenue_dict[date_str]['booking_count'] = int(row.count)
                else:
                    revenue_dict[date_str] = {
                        'date': date_str,
                        'order_revenue': 0,
                        'order_count': 0,
                        'booking_revenue': float(row.revenue),
                        'booking_count': int(row.count)
                    }
            
            # Calculate totals
            chart_data = []
            for data in sorted(revenue_dict.values(), key=lambda x: x['date']):
                data['total_revenue'] = data['order_revenue'] + data['booking_revenue']
                chart_data.append(data)
        
        elif period == 'weekly':
            # Weekly aggregation
            order_revenue = db.session.query(
                func.date_trunc('week', Order.created_at).label('week'),
                func.sum(Order.total_price).label('revenue'),
                func.count(Order.id).label('count')
            ).filter(Order.created_at >= start_date)\
            .group_by(func.date_trunc('week', Order.created_at))\
            .order_by('week').all()
            
            chart_data = []
            for row in order_revenue:
                chart_data.append({
                    'week': row.week.isoformat() if row.week else None,
                    'revenue': float(row.revenue),
                    'order_count': int(row.count)
                })
        
        elif period == 'monthly':
            # Monthly aggregation
            order_revenue = db.session.query(
                func.date_trunc('month', Order.created_at).label('month'),
                func.sum(Order.total_price).label('revenue'),
                func.count(Order.id).label('count')
            ).filter(Order.created_at >= start_date)\
            .group_by(func.date_trunc('month', Order.created_at))\
            .order_by('month').all()
            
            chart_data = []
            for row in order_revenue:
                chart_data.append({
                    'month': row.month.isoformat() if row.month else None,
                    'revenue': float(row.revenue),
                    'order_count': int(row.count)
                })
        
        return jsonify({
            'period': period,
            'days': days,
            'data': chart_data
        }), 200

    except Exception as e:
        return jsonify({'error': f'Failed to fetch revenue trends: {str(e)}'}), 500


@analytics_bp.route('/products/top-performers', methods=['GET'])
@jwt_required()
def get_top_performing_products():
    """Get top performing products by various metrics"""
    try:
        current_user_id = get_jwt_identity()
        if not check_admin_role(current_user_id):
            return jsonify({'error': 'Admin access required'}), 403

        days = request.args.get('days', 30, type=int)
        limit = request.args.get('limit', 10, type=int)
        start_date = datetime.utcnow() - timedelta(days=days)
        
        revenue_expr = func.sum(OrderItem.quantity * OrderItem.price_at_purchase)

        top_by_revenue = db.session.query(
            Products.id,
            Products.name,
            ProductCategory.name.label('category'),
            revenue_expr.label('revenue'),
            func.sum(OrderItem.quantity).label('quantity'),
            func.count(func.distinct(Order.id)).label('order_count')
        ).join(
            OrderItem, OrderItem.product_id == Products.id
        ).join(
            Order, Order.id == OrderItem.order_id
        ).join(
            ProductCategory, Products.product_category_id == ProductCategory.id
        ).filter(
            Order.created_at >= start_date
        ).group_by(
            Products.id, Products.name, ProductCategory.name
        ).order_by(
            revenue_expr.desc()
        ).limit(limit).all()
        
        revenue_data = []
        for row in top_by_revenue:
            revenue_data.append({
                'product_id': row.id,
                'product_name': row.name,
                'category': row.category,
                'revenue': float(row.revenue),
                'quantity_sold': int(row.quantity),
                'order_count': int(row.order_count)
            })

        quantity_expr = func.sum(OrderItem.quantity)
        
        top_by_quantity = db.session.query(
            Products.id,
            Products.name,
            ProductCategory.name.label('category'),
            quantity_expr.label('quantity'),
            revenue_expr.label('revenue')
        ).join(
            OrderItem, OrderItem.product_id == Products.id
        ).join(
            Order, Order.id == OrderItem.order_id
        ).join(
            ProductCategory, Products.product_category_id == ProductCategory.id
        ).filter(
            Order.created_at >= start_date
        ).group_by(
            Products.id, Products.name, ProductCategory.name
        ).order_by(
            quantity_expr.desc()
        ).limit(limit).all()
        
        quantity_data = []
        for row in top_by_quantity:
            quantity_data.append({
                'product_id': row.id,
                'product_name': row.name,
                'category': row.category,
                'quantity_sold': int(row.quantity),
                'revenue': float(row.revenue)
            })
        
        avg_rating_expr = func.avg(ProductRating.rating)
        # Top rated products
        top_rated = db.session.query(
            Products.id,
            Products.name,
            ProductCategory.name.label('category'),
            avg_rating_expr.label('avg_rating'),
            func.count(ProductRating.id).label('rating_count')
        ).join(
            ProductRating, ProductRating.product_id == Products.id
        ).join(
            ProductCategory, Products.product_category_id == ProductCategory.id
        ).group_by(
            Products.id, Products.name, ProductCategory.name
        ).having(
            func.count(ProductRating.id) >= 3
        ).order_by(
            avg_rating_expr.desc()
        ).limit(limit).all()
        
        rating_data = []
        for row in top_rated:
            rating_data.append({
                'product_id': row.id,
                'product_name': row.name,
                'category': row.category,
                'avg_rating': round(float(row.avg_rating), 2),
                'rating_count': int(row.rating_count)
            })
        
        return jsonify({
            'period_days': days,
            'top_by_revenue': revenue_data,
            'top_by_quantity': quantity_data,
            'top_rated': rating_data
        }), 200

    except Exception as e:
        return jsonify({'error': f'Failed to fetch top products: {str(e)}'}), 500


@analytics_bp.route('/categories/performance', methods=['GET'])
@jwt_required()
def get_category_performance():
    """Get performance metrics by product category"""
    try:
        current_user_id = get_jwt_identity()
        if not check_admin_role(current_user_id):
            return jsonify({'error': 'Admin access required'}), 403

        days = request.args.get('days', 30, type=int)
        start_date = datetime.utcnow() - timedelta(days=days)
        
        category_stats = db.session.query(
            ProductCategory.id,
            ProductCategory.name,
            func.count(func.distinct(Products.id)).label('product_count'),
            func.sum(OrderItem.quantity).label('total_quantity'),
            func.sum(OrderItem.quantity * OrderItem.price_at_purchase).label('total_revenue'),
            func.count(func.distinct(Order.id)).label('order_count'),
            func.avg(ProductRating.rating).label('avg_rating')
        ).join(Products, Products.product_category_id == ProductCategory.id)\
        .outerjoin(OrderItem, OrderItem.product_id == Products.id)\
        .outerjoin(Order, and_(Order.id == OrderItem.order_id, Order.created_at >= start_date))\
        .outerjoin(ProductRating, ProductRating.product_id == Products.id)\
        .group_by(ProductCategory.id, ProductCategory.name)\
        .all()
        
        categories_data = []
        for row in category_stats:
            categories_data.append({
                'category_id': row.id,
                'category_name': row.name,
                'product_count': int(row.product_count),
                'total_quantity_sold': int(row.total_quantity) if row.total_quantity else 0,
                'total_revenue': float(row.total_revenue) if row.total_revenue else 0,
                'order_count': int(row.order_count) if row.order_count else 0,
                'avg_rating': round(float(row.avg_rating), 2) if row.avg_rating else 0
            })
        
        # Sort by revenue
        categories_data.sort(key=lambda x: x['total_revenue'], reverse=True)
        
        return jsonify({
            'period_days': days,
            'categories': categories_data
        }), 200

    except Exception as e:
        return jsonify({'error': f'Failed to fetch category performance: {str(e)}'}), 500


@analytics_bp.route('/customers/insights', methods=['GET'])
@jwt_required()
def get_customer_insights():
    """Get customer behavior insights"""
    try:
        current_user_id = get_jwt_identity()
        if not check_admin_role(current_user_id):
            return jsonify({'error': 'Admin access required'}), 403

        days = request.args.get('days', 30, type=int)
        start_date = datetime.utcnow() - timedelta(days=days)
        
        # Top customers by spending
        top_spenders = db.session.query(
            User.user_id,
            User.first_name,
            User.last_name,
            User.email,
            func.count(func.distinct(Order.id)).label('order_count'),
            func.sum(Order.total_price).label('total_spent'),
            func.avg(Order.total_price).label('avg_order_value')
        ).join(Order)\
        .filter(Order.created_at >= start_date)\
        .group_by(User.user_id, User.first_name, User.last_name, User.email)\
        .order_by(desc('total_spent'))\
        .limit(10).all()
        
        spenders_data = []
        for row in top_spenders:
            spenders_data.append({
                'user_id': row.user_id,
                'name': f"{row.first_name} {row.last_name}",
                'email': row.email,
                'order_count': int(row.order_count),
                'total_spent': float(row.total_spent),
                'avg_order_value': float(row.avg_order_value)
            })
        
        # Most active customers (by order frequency)
        most_active = db.session.query(
            User.user_id,
            User.first_name,
            User.last_name,
            User.email,
            func.count(Order.id).label('order_count'),
            func.sum(Order.total_price).label('total_spent')
        ).join(Order)\
        .filter(Order.created_at >= start_date)\
        .group_by(User.user_id, User.first_name, User.last_name, User.email)\
        .order_by(desc('order_count'))\
        .limit(10).all()
        
        active_data = []
        for row in most_active:
            active_data.append({
                'user_id': row.user_id,
                'name': f"{row.first_name} {row.last_name}",
                'email': row.email,
                'order_count': int(row.order_count),
                'total_spent': float(row.total_spent)
            })
        
        # Customer acquisition (new customers over time)
        new_customers = db.session.query(
            func.date(User.created_at).label('date'),
            func.count(User.user_id).label('count')
        ).filter(User.created_at >= start_date)\
        .filter(User.role == 'Member')\
        .group_by(func.date(User.created_at))\
        .order_by('date').all()
        
        acquisition_data = []
        for row in new_customers:
            acquisition_data.append({
                'date': row.date.isoformat(),
                'new_customers': int(row.count)
            })
        
        # Customer retention (customers who made multiple orders)
        repeat_customers = db.session.query(
            func.count(func.distinct(Order.user_id))
        ).filter(Order.created_at >= start_date)\
        .having(func.count(Order.id) > 1).scalar() or 0
        
        total_customers = db.session.query(
            func.count(func.distinct(Order.user_id))
        ).filter(Order.created_at >= start_date).scalar() or 0
        
        retention_rate = 0
        if total_customers > 0:
            retention_rate = (repeat_customers / total_customers) * 100
        
        return jsonify({
            'period_days': days,
            'top_spenders': spenders_data,
            'most_active': active_data,
            'acquisition_trend': acquisition_data,
            'retention': {
                'repeat_customers': repeat_customers,
                'total_customers': total_customers,
                'retention_rate': round(retention_rate, 2)
            }
        }), 200

    except Exception as e:
        return jsonify({'error': f'Failed to fetch customer insights: {str(e)}'}), 500


@analytics_bp.route('/trainers/performance', methods=['GET'])
@jwt_required()
def get_trainer_performance():
    """Get trainer performance metrics"""
    try:
        current_user_id = get_jwt_identity()
        if not check_admin_role(current_user_id):
            return jsonify({'error': 'Admin access required'}), 403

        days = request.args.get('days', 30, type=int)
        start_date = datetime.utcnow() - timedelta(days=days)
        
        trainer_stats = db.session.query(
            User.user_id,
            User.first_name,
            User.last_name,
            Trainer.specialization,
            Trainer.hourly_rate,
            func.count(func.distinct(TrainerSession.id)).label('sessions_created'),
            func.count(func.distinct(Booking.id)).label('total_bookings'),
            func.sum(case((Booking.status == 'confirmed', 1), else_=0)).label('confirmed_bookings'),
            func.sum(case((Booking.status == 'cancelled', 1), else_=0)).label('cancelled_bookings'),
            func.sum(case((Booking.status == 'confirmed', TrainerSession.price), else_=0)).label('revenue')
        ).join(Trainer, User.user_id == Trainer.user_id)\
        .join(TrainerSession, User.user_id == TrainerSession.trainer_id)\
        .outerjoin(Booking, TrainerSession.id == Booking.session_id)\
        .filter(TrainerSession.created_at >= start_date)\
        .group_by(User.user_id, User.first_name, User.last_name, Trainer.specialization, Trainer.hourly_rate)\
        .order_by(desc('revenue'))\
        .all()
        
        trainers_data = []
        for row in trainer_stats:
            bookings = int(row.total_bookings) if row.total_bookings else 0
            confirmed = int(row.confirmed_bookings) if row.confirmed_bookings else 0
            cancelled = int(row.cancelled_bookings) if row.cancelled_bookings else 0
            
            utilization_rate = 0
            if bookings > 0:
                utilization_rate = (confirmed / bookings) * 100
            
            trainers_data.append({
                'user_id': row.user_id,
                'name': f"{row.first_name} {row.last_name}",
                'specialization': row.specialization,
                'hourly_rate': float(row.hourly_rate) if row.hourly_rate else 0,
                'sessions_created': int(row.sessions_created),
                'total_bookings': bookings,
                'confirmed_bookings': confirmed,
                'cancelled_bookings': cancelled,
                'utilization_rate': round(utilization_rate, 2),
                'revenue': float(row.revenue) if row.revenue else 0
            })
        
        return jsonify({
            'period_days': days,
            'trainers': trainers_data
        }), 200

    except Exception as e:
        return jsonify({'error': f'Failed to fetch trainer performance: {str(e)}'}), 500


@analytics_bp.route('/bookings/analysis', methods=['GET'])
@jwt_required()
def get_booking_analysis():
    """Get detailed booking analysis"""
    try:
        current_user_id = get_jwt_identity()
        if not check_admin_role(current_user_id):
            return jsonify({'error': 'Admin access required'}), 403

        days = request.args.get('days', 30, type=int)
        start_date = datetime.utcnow() - timedelta(days=days)
        
        # Booking trends over time
        daily_bookings = db.session.query(
            func.date(Booking.created_at).label('date'),
            func.count(Booking.id).label('total'),
            func.sum(case((Booking.status == 'confirmed', 1), else_=0)).label('confirmed'),
            func.sum(case((Booking.status == 'cancelled', 1), else_=0)).label('cancelled')
        ).filter(Booking.created_at >= start_date)\
        .group_by(func.date(Booking.created_at))\
        .order_by('date').all()
        
        trend_data = []
        for row in daily_bookings:
            trend_data.append({
                'date': row.date.isoformat(),
                'total': int(row.total),
                'confirmed': int(row.confirmed),
                'cancelled': int(row.cancelled)
            })
        
        # Popular class types
        from models import ClassType
        
        popular_classes = db.session.query(
            ClassType.name,
            func.count(Booking.id).label('booking_count'),
            func.avg(TrainerSession.price).label('avg_price')
        ).join(TrainerSession, ClassType.id == TrainerSession.class_type_id)\
        .join(Booking, TrainerSession.id == Booking.session_id)\
        .filter(Booking.created_at >= start_date)\
        .group_by(ClassType.name)\
        .order_by(desc('booking_count'))\
        .all()
        
        classes_data = []
        for row in popular_classes:
            classes_data.append({
                'class_type': row.name,
                'booking_count': int(row.booking_count),
                'avg_price': float(row.avg_price) if row.avg_price else 0
            })
        
        # Peak booking times (by hour)
        peak_times = db.session.query(
            extract('hour', TrainerSession.start_time).label('hour'),
            func.count(Booking.id).label('booking_count')
        ).join(Booking, TrainerSession.id == Booking.session_id)\
        .filter(Booking.created_at >= start_date)\
        .group_by('hour')\
        .order_by('hour').all()
        
        times_data = []
        for row in peak_times:
            times_data.append({
                'hour': int(row.hour),
                'booking_count': int(row.booking_count)
            })
        
        return jsonify({
            'period_days': days,
            'booking_trends': trend_data,
            'popular_classes': classes_data,
            'peak_booking_times': times_data
        }), 200

    except Exception as e:
        return jsonify({'error': f'Failed to fetch booking analysis: {str(e)}'}), 500


@analytics_bp.route('/memberships/overview', methods=['GET'])
@jwt_required()
def get_membership_overview():
    """Get membership analytics"""
    try:
        current_user_id = get_jwt_identity()
        if not check_admin_role(current_user_id):
            return jsonify({'error': 'Admin access required'}), 403

        # Membership distribution by type
        membership_types = db.session.query(
            Membership.membership_type,
            func.count(Membership.id).label('count')
        ).filter(Membership.is_active == True)\
        .group_by(Membership.membership_type)\
        .all()
        
        types_data = []
        for row in membership_types:
            types_data.append({
                'type': row.membership_type,
                'count': int(row.count)
            })
        
        # Expiring memberships (next 30 days)
        today = date.today()
        expiring = []
        for i in range(1, 31):
            check_date = today + timedelta(days=i)
            count = Membership.query.filter(
                and_(
                    Membership.is_active == True,
                    Membership.end_date == check_date
                )
            ).count()
            expiring.append({
                'date': check_date.isoformat(),
                'expiring_count': count
            })
        
        # New memberships over time (last 30 days)
        start_date = datetime.utcnow() - timedelta(days=30)
        new_memberships = db.session.query(
            func.date(Membership.created_at).label('date'),
            func.count(Membership.id).label('count')
        ).filter(Membership.created_at >= start_date)\
        .group_by(func.date(Membership.created_at))\
        .order_by('date').all()
        
        new_data = []
        for row in new_memberships:
            new_data.append({
                'date': row.date.isoformat(),
                'new_memberships': int(row.count)
            })
        
        return jsonify({
            'membership_distribution': types_data,
            'expiring_memberships': expiring,
            'new_memberships_trend': new_data
        }), 200

    except Exception as e:
        return jsonify({'error': f'Failed to fetch membership overview: {str(e)}'}),


@analytics_bp.route('/export/csv', methods=['GET'])
@jwt_required()
def export_analytics_csv():
    """Export analytics data as CSV"""
    try:
        current_user_id = get_jwt_identity()
        if not check_admin_role(current_user_id):
            return jsonify({'error': 'Admin access required'}), 403

        export_type = request.args.get('type', 'dashboard')
        days = request.args.get('days', 30, type=int)
        start_date = datetime.utcnow() - timedelta(days=days)
        
        output = StringIO()
        writer = csv.writer(output)
        
        if export_type == 'dashboard':
            # Dashboard overview export
            writer.writerow(['Metric Category', 'Metric', 'Value'])
            
            # User metrics
            total_users = User.query.count()
            new_users = User.query.filter(User.created_at >= start_date).count()
            active_members = User.query.filter(
                and_(User.role == 'Member', User.is_active == True)
            ).count()
            
            writer.writerow(['Users', 'Total Users', total_users])
            writer.writerow(['Users', 'New Users', new_users])
            writer.writerow(['Users', 'Active Members', active_members])
            
            # Revenue metrics
            total_revenue = db.session.query(func.sum(Order.total_price)).scalar() or 0
            recent_revenue = db.session.query(func.sum(Order.total_price))\
                .filter(Order.created_at >= start_date).scalar() or 0
            
            writer.writerow(['Revenue', 'Total Revenue', f'${total_revenue:.2f}'])
            writer.writerow(['Revenue', 'Recent Revenue', f'${recent_revenue:.2f}'])
            
            # Order metrics
            total_orders = Order.query.count()
            recent_orders = Order.query.filter(Order.created_at >= start_date).count()
            
            writer.writerow(['Orders', 'Total Orders', total_orders])
            writer.writerow(['Orders', 'Recent Orders', recent_orders])
            
        elif export_type == 'revenue_trends':
            # Revenue trends export
            writer.writerow(['Date', 'Order Revenue', 'Order Count', 'Booking Revenue', 'Booking Count', 'Total Revenue'])
            
            order_revenue = db.session.query(
                func.date(Order.created_at).label('date'),
                func.sum(Order.total_price).label('revenue'),
                func.count(Order.id).label('count')
            ).filter(Order.created_at >= start_date)\
            .group_by(func.date(Order.created_at))\
            .order_by('date').all()
            
            booking_revenue = db.session.query(
                func.date(Booking.created_at).label('date'),
                func.sum(TrainerSession.price).label('revenue'),
                func.count(Booking.id).label('count')
            ).join(TrainerSession)\
            .filter(Booking.created_at >= start_date)\
            .filter(Booking.status == 'confirmed')\
            .group_by(func.date(Booking.created_at))\
            .order_by('date').all()
            
            revenue_dict = {}
            for row in order_revenue:
                date_str = row.date.isoformat()
                revenue_dict[date_str] = {
                    'order_revenue': float(row.revenue),
                    'order_count': int(row.count),
                    'booking_revenue': 0,
                    'booking_count': 0
                }
            
            for row in booking_revenue:
                date_str = row.date.isoformat()
                if date_str in revenue_dict:
                    revenue_dict[date_str]['booking_revenue'] = float(row.revenue)
                    revenue_dict[date_str]['booking_count'] = int(row.count)
                else:
                    revenue_dict[date_str] = {
                        'order_revenue': 0,
                        'order_count': 0,
                        'booking_revenue': float(row.revenue),
                        'booking_count': int(row.count)
                    }
            
            for date_str in sorted(revenue_dict.keys()):
                data = revenue_dict[date_str]
                total = data['order_revenue'] + data['booking_revenue']
                writer.writerow([
                    date_str,
                    f"${data['order_revenue']:.2f}",
                    data['order_count'],
                    f"${data['booking_revenue']:.2f}",
                    data['booking_count'],
                    f"${total:.2f}"
                ])
                
        elif export_type == 'top_products':
            # Top products export
            writer.writerow(['Product Name', 'Category', 'Revenue', 'Quantity Sold', 'Order Count'])
            
            limit = request.args.get('limit', 50, type=int)
            revenue_expr = func.sum(OrderItem.quantity * OrderItem.price_at_purchase)
            
            top_products = db.session.query(
                Products.name,
                ProductCategory.name.label('category'),
                revenue_expr.label('revenue'),
                func.sum(OrderItem.quantity).label('quantity'),
                func.count(func.distinct(Order.id)).label('order_count')
            ).join(OrderItem, OrderItem.product_id == Products.id)\
            .join(Order, Order.id == OrderItem.order_id)\
            .join(ProductCategory, Products.product_category_id == ProductCategory.id)\
            .filter(Order.created_at >= start_date)\
            .group_by(Products.name, ProductCategory.name)\
            .order_by(revenue_expr.desc())\
            .limit(limit).all()
            
            for row in top_products:
                writer.writerow([
                    row.name,
                    row.category,
                    f"${row.revenue:.2f}",
                    int(row.quantity),
                    int(row.order_count)
                ])
                
        elif export_type == 'customers':
            # Customer insights export
            writer.writerow(['User ID', 'Name', 'Email', 'Order Count', 'Total Spent', 'Avg Order Value'])
            
            customers = db.session.query(
                User.user_id,
                User.first_name,
                User.last_name,
                User.email,
                func.count(func.distinct(Order.id)).label('order_count'),
                func.sum(Order.total_price).label('total_spent'),
                func.avg(Order.total_price).label('avg_order_value')
            ).join(Order)\
            .filter(Order.created_at >= start_date)\
            .group_by(User.user_id, User.first_name, User.last_name, User.email)\
            .order_by(desc('total_spent'))\
            .limit(100).all()
            
            for row in customers:
                writer.writerow([
                    row.user_id,
                    f"{row.first_name} {row.last_name}",
                    row.email,
                    int(row.order_count),
                    f"${row.total_spent:.2f}",
                    f"${row.avg_order_value:.2f}"
                ])
                
        elif export_type == 'trainers':
            # Trainer performance export
            writer.writerow([
                'Trainer ID', 'Name', 'Specialization', 'Hourly Rate',
                'Sessions Created', 'Total Bookings', 'Confirmed', 'Cancelled',
                'Utilization Rate', 'Revenue'
            ])
            
            trainer_stats = db.session.query(
                User.user_id,
                User.first_name,
                User.last_name,
                Trainer.specialization,
                Trainer.hourly_rate,
                func.count(func.distinct(TrainerSession.id)).label('sessions_created'),
                func.count(func.distinct(Booking.id)).label('total_bookings'),
                func.sum(case((Booking.status == 'confirmed', 1), else_=0)).label('confirmed'),
                func.sum(case((Booking.status == 'cancelled', 1), else_=0)).label('cancelled'),
                func.sum(case((Booking.status == 'confirmed', TrainerSession.price), else_=0)).label('revenue')
            ).join(Trainer, User.user_id == Trainer.user_id)\
            .join(TrainerSession, User.user_id == TrainerSession.trainer_id)\
            .outerjoin(Booking, TrainerSession.id == Booking.session_id)\
            .filter(TrainerSession.created_at >= start_date)\
            .group_by(User.user_id, User.first_name, User.last_name, Trainer.specialization, Trainer.hourly_rate)\
            .order_by(desc('revenue'))\
            .all()
            
            for row in trainer_stats:
                bookings = int(row.total_bookings) if row.total_bookings else 0
                confirmed = int(row.confirmed) if row.confirmed else 0
                utilization = (confirmed / bookings * 100) if bookings > 0 else 0
                
                writer.writerow([
                    row.user_id,
                    f"{row.first_name} {row.last_name}",
                    row.specialization,
                    f"${row.hourly_rate:.2f}" if row.hourly_rate else '$0.00',
                    int(row.sessions_created),
                    bookings,
                    confirmed,
                    int(row.cancelled) if row.cancelled else 0,
                    f"{utilization:.2f}%",
                    f"${row.revenue:.2f}" if row.revenue else '$0.00'
                ])
                
        elif export_type == 'bookings':
            # Bookings analysis export
            writer.writerow(['Date', 'Total Bookings', 'Confirmed', 'Cancelled', 'Cancellation Rate'])
            
            daily_bookings = db.session.query(
                func.date(Booking.created_at).label('date'),
                func.count(Booking.id).label('total'),
                func.sum(case((Booking.status == 'confirmed', 1), else_=0)).label('confirmed'),
                func.sum(case((Booking.status == 'cancelled', 1), else_=0)).label('cancelled')
            ).filter(Booking.created_at >= start_date)\
            .group_by(func.date(Booking.created_at))\
            .order_by('date').all()
            
            for row in daily_bookings:
                total = int(row.total)
                cancelled = int(row.cancelled)
                cancel_rate = (cancelled / total * 100) if total > 0 else 0
                
                writer.writerow([
                    row.date.isoformat(),
                    total,
                    int(row.confirmed),
                    cancelled,
                    f"{cancel_rate:.2f}%"
                ])
        
        else:
            return jsonify({'error': 'Invalid export type'}), 400
        
        # Create response
        output.seek(0)
        filename = f'analytics_{export_type}_{datetime.utcnow().strftime("%Y%m%d_%H%M%S")}.csv'
        
        return Response(
            output.getvalue(),
            mimetype='text/csv',
            headers={
                'Content-Disposition': f'attachment; filename={filename}',
                'Content-Type': 'text/csv; charset=utf-8'
            }
        )

    except Exception as e:
        return jsonify({'error': f'Failed to export CSV: {str(e)}'}), 500