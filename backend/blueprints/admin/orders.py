from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from sqlalchemy import func, desc, and_, extract
from datetime import datetime, timedelta
from models import db, Order, OrderItem, Products, User

orders_bp = Blueprint('orders', __name__, url_prefix='/api/orders')

# Helper function to check if current user is admin
def check_admin_role(user_id):
    """Check if user has admin role"""
    user = User.query.get(user_id)
    if not user or user.role != 'Admin':
        return False
    return True


@orders_bp.route('/', methods=['GET'])
@jwt_required()
def get_orders():
    """Get all orders with pagination and filtering"""
    try:
        current_user_id = get_jwt_identity()
        if not check_admin_role(current_user_id):
            return jsonify({'error': 'Admin access required'}), 403

        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 10, type=int)
        user_id = request.args.get('user_id', type=str)
        start_date = request.args.get('start_date', type=str)
        end_date = request.args.get('end_date', type=str)
        
        query = Order.query
        
        # Apply filters
        if user_id:
            query = query.filter(Order.user_id == user_id)
        
        if start_date:
            start = datetime.strptime(start_date, '%Y-%m-%d')
            query = query.filter(Order.created_at >= start)
        
        if end_date:
            end = datetime.strptime(end_date, '%Y-%m-%d')
            query = query.filter(Order.created_at <= end)
        
        # Order by most recent first
        query = query.order_by(desc(Order.created_at))
        
        # Paginate
        pagination = query.paginate(page=page, per_page=per_page, error_out=False)
        
        orders_data = []
        for order in pagination.items:
            user = User.query.get(order.user_id)
            order_items = OrderItem.query.filter_by(order_id=order.id).all()
            
            items_data = []
            for item in order_items:
                product = Products.query.get(item.product_id)
                items_data.append({
                    'id': item.id,
                    'product_id': item.product_id,
                    'product_name': product.name if product else 'Unknown',
                    'quantity': item.quantity,
                    'price_at_purchase': float(item.price_at_purchase),
                    'subtotal': float(item.price_at_purchase * item.quantity)
                })
            
            orders_data.append({
                'id': order.id,
                'user_id': order.user_id,
                'user_name': f"{user.first_name} {user.last_name}" if user else 'Unknown',
                'user_email': user.email if user else 'Unknown',
                'total_price': float(order.total_price),
                'items_count': len(items_data),
                'items': items_data,
                'created_at': order.created_at.isoformat() if order.created_at else None
            })
        
        return jsonify({
            'orders': orders_data,
            'pagination': {
                'page': pagination.page,
                'per_page': pagination.per_page,
                'total': pagination.total,
                'pages': pagination.pages,
                'has_next': pagination.has_next,
                'has_prev': pagination.has_prev
            }
        }), 200

    except Exception as e:
        return jsonify({'error': f'Failed to fetch orders: {str(e)}'}), 500


@orders_bp.route('/<int:order_id>', methods=['GET'])
@jwt_required()
def get_order_details(order_id):
    """Get detailed information about a specific order"""
    try:
        current_user_id = get_jwt_identity()
        if not check_admin_role(current_user_id):
            return jsonify({'error': 'Admin access required'}), 403

        order = Order.query.get(order_id)
        if not order:
            return jsonify({'error': 'Order not found'}), 404

        user = User.query.get(order.user_id)
        order_items = OrderItem.query.filter_by(order_id=order.id).all()
        
        items_data = []
        for item in order_items:
            product = Products.query.get(item.product_id)
            items_data.append({
                'id': item.id,
                'product_id': item.product_id,
                'product_name': product.name if product else 'Unknown',
                'product_description': product.description if product else '',
                'quantity': item.quantity,
                'price_at_purchase': float(item.price_at_purchase),
                'subtotal': float(item.price_at_purchase * item.quantity)
            })
        
        return jsonify({
            'id': order.id,
            'user': {
                'id': order.user_id,
                'name': f"{user.first_name} {user.last_name}" if user else 'Unknown',
                'email': user.email if user else 'Unknown',
                'phone': user.phone if user else None
            },
            'total_price': float(order.total_price),
            'items': items_data,
            'created_at': order.created_at.isoformat() if order.created_at else None
        }), 200

    except Exception as e:
        return jsonify({'error': f'Failed to fetch order details: {str(e)}'}), 500


@orders_bp.route('/analytics/overview', methods=['GET'])
@jwt_required()
def get_analytics_overview():
    """Get overview analytics for orders"""
    try:
        current_user_id = get_jwt_identity()
        if not check_admin_role(current_user_id):
            return jsonify({'error': 'Admin access required'}), 403

        days = request.args.get('days', 30, type=int)
        start_date = datetime.utcnow() - timedelta(days=days)
        
        # Total orders
        total_orders = Order.query.count()
        
        # Recent orders (last X days)
        recent_orders = Order.query.filter(Order.created_at >= start_date).count()
        
        # Total revenue
        total_revenue = db.session.query(func.sum(Order.total_price)).scalar() or 0
        
        # Recent revenue
        recent_revenue = db.session.query(func.sum(Order.total_price))\
            .filter(Order.created_at >= start_date).scalar() or 0
        
        # Average order value
        avg_order_value = db.session.query(func.avg(Order.total_price)).scalar() or 0
        
        # Recent average order value
        recent_avg_order_value = db.session.query(func.avg(Order.total_price))\
            .filter(Order.created_at >= start_date).scalar() or 0
        
        # Top selling products
        top_products = db.session.query(
            Products.id,
            Products.name,
            func.sum(OrderItem.quantity).label('total_quantity'),
            func.sum(OrderItem.quantity * OrderItem.price_at_purchase).label('total_revenue')
        ).join(OrderItem).join(Order)\
        .filter(Order.created_at >= start_date)\
        .group_by(Products.id, Products.name)\
        .order_by(desc('total_quantity'))\
        .limit(5).all()
        
        top_products_data = []
        for product in top_products:
            top_products_data.append({
                'product_id': product.id,
                'product_name': product.name,
                'total_quantity': int(product.total_quantity),
                'total_revenue': float(product.total_revenue)
            })
        
        # Top customers
        top_customers = db.session.query(
            User.user_id,
            User.first_name,
            User.last_name,
            User.email,
            func.count(Order.id).label('order_count'),
            func.sum(Order.total_price).label('total_spent')
        ).join(Order)\
        .filter(Order.created_at >= start_date)\
        .group_by(User.user_id, User.first_name, User.last_name, User.email)\
        .order_by(desc('total_spent'))\
        .limit(5).all()
        
        top_customers_data = []
        for customer in top_customers:
            top_customers_data.append({
                'user_id': customer.user_id,
                'name': f"{customer.first_name} {customer.last_name}",
                'email': customer.email,
                'order_count': int(customer.order_count),
                'total_spent': float(customer.total_spent)
            })
        
        return jsonify({
            'overview': {
                'total_orders': total_orders,
                'recent_orders': recent_orders,
                'total_revenue': float(total_revenue),
                'recent_revenue': float(recent_revenue),
                'avg_order_value': float(avg_order_value),
                'recent_avg_order_value': float(recent_avg_order_value)
            },
            'top_products': top_products_data,
            'top_customers': top_customers_data,
            'period_days': days
        }), 200

    except Exception as e:
        return jsonify({'error': f'Failed to fetch analytics: {str(e)}'}), 500


@orders_bp.route('/analytics/revenue-chart', methods=['GET'])
@jwt_required()
def get_revenue_chart():
    """Get revenue data for charts (daily/weekly/monthly)"""
    try:
        current_user_id = get_jwt_identity()
        if not check_admin_role(current_user_id):
            return jsonify({'error': 'Admin access required'}), 403

        period = request.args.get('period', 'daily')  # daily, weekly, monthly
        days = request.args.get('days', 30, type=int)
        
        start_date = datetime.utcnow() - timedelta(days=days)
        
        if period == 'daily':
            # Group by day
            revenue_data = db.session.query(
                func.date(Order.created_at).label('date'),
                func.count(Order.id).label('order_count'),
                func.sum(Order.total_price).label('revenue')
            ).filter(Order.created_at >= start_date)\
            .group_by(func.date(Order.created_at))\
            .order_by('date').all()
            
            chart_data = []
            for row in revenue_data:
                chart_data.append({
                    'date': row.date.isoformat(),
                    'order_count': int(row.order_count),
                    'revenue': float(row.revenue)
                })
                
        elif period == 'weekly':
            # Group by week
            revenue_data = db.session.query(
                func.date_trunc('week', Order.created_at).label('week'),
                func.count(Order.id).label('order_count'),
                func.sum(Order.total_price).label('revenue')
            ).filter(Order.created_at >= start_date)\
            .group_by(func.date_trunc('week', Order.created_at))\
            .order_by('week').all()
            
            chart_data = []
            for row in revenue_data:
                chart_data.append({
                    'week': row.week.isoformat() if row.week else None,
                    'order_count': int(row.order_count),
                    'revenue': float(row.revenue)
                })
                
        elif period == 'monthly':
            # Group by month
            revenue_data = db.session.query(
                func.date_trunc('month', Order.created_at).label('month'),
                func.count(Order.id).label('order_count'),
                func.sum(Order.total_price).label('revenue')
            ).filter(Order.created_at >= start_date)\
            .group_by(func.date_trunc('month', Order.created_at))\
            .order_by('month').all()
            
            chart_data = []
            for row in revenue_data:
                chart_data.append({
                    'month': row.month.isoformat() if row.month else None,
                    'order_count': int(row.order_count),
                    'revenue': float(row.revenue)
                })
        
        return jsonify({
            'period': period,
            'days': days,
            'data': chart_data
        }), 200

    except Exception as e:
        return jsonify({'error': f'Failed to fetch revenue chart data: {str(e)}'}), 500


@orders_bp.route('/analytics/product-distribution', methods=['GET'])
@jwt_required()
def get_product_distribution():
    """Get product category distribution for pie charts"""
    try:
        current_user_id = get_jwt_identity()
        if not check_admin_role(current_user_id):
            return jsonify({'error': 'Admin access required'}), 403

        days = request.args.get('days', 30, type=int)
        start_date = datetime.utcnow() - timedelta(days=days)
        
        # Get product distribution by category
        from models import ProductCategory
        
        category_data = db.session.query(
            ProductCategory.name,
            func.sum(OrderItem.quantity).label('total_quantity'),
            func.sum(OrderItem.quantity * OrderItem.price_at_purchase).label('total_revenue')
        ).join(Products, Products.product_category_id == ProductCategory.id)\
        .join(OrderItem, OrderItem.product_id == Products.id)\
        .join(Order, Order.id == OrderItem.order_id)\
        .filter(Order.created_at >= start_date)\
        .group_by(ProductCategory.name)\
        .all()
        
        distribution_data = []
        for row in category_data:
            distribution_data.append({
                'category': row.name,
                'quantity': int(row.total_quantity),
                'revenue': float(row.total_revenue)
            })
        
        return jsonify({
            'period_days': days,
            'distribution': distribution_data
        }), 200

    except Exception as e:
        return jsonify({'error': f'Failed to fetch product distribution: {str(e)}'}), 500


@orders_bp.route('/user/<user_id>', methods=['GET'])
@jwt_required()
def get_user_orders(user_id):
    """Get all orders for a specific user"""
    try:
        current_user_id = get_jwt_identity()
        
        # Users can view their own orders, admins can view any orders
        if current_user_id != user_id and not check_admin_role(current_user_id):
            return jsonify({'error': 'Access denied'}), 403

        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 10, type=int)
        
        query = Order.query.filter_by(user_id=user_id).order_by(desc(Order.created_at))
        pagination = query.paginate(page=page, per_page=per_page, error_out=False)
        
        orders_data = []
        for order in pagination.items:
            order_items = OrderItem.query.filter_by(order_id=order.id).all()
            
            items_data = []
            for item in order_items:
                product = Products.query.get(item.product_id)
                items_data.append({
                    'id': item.id,
                    'product_id': item.product_id,
                    'product_name': product.name if product else 'Unknown',
                    'quantity': item.quantity,
                    'price_at_purchase': float(item.price_at_purchase),
                    'subtotal': float(item.price_at_purchase * item.quantity)
                })
            
            orders_data.append({
                'id': order.id,
                'total_price': float(order.total_price),
                'items_count': len(items_data),
                'items': items_data,
                'created_at': order.created_at.isoformat() if order.created_at else None
            })
        
        return jsonify({
            'user_id': user_id,
            'orders': orders_data,
            'pagination': {
                'page': pagination.page,
                'per_page': pagination.per_page,
                'total': pagination.total,
                'pages': pagination.pages
            }
        }), 200

    except Exception as e:
        return jsonify({'error': f'Failed to fetch user orders: {str(e)}'}), 500


@orders_bp.route('/stats', methods=['GET'])
@jwt_required()
def get_order_statistics():
    """Get overall order statistics"""
    try:
        current_user_id = get_jwt_identity()
        if not check_admin_role(current_user_id):
            return jsonify({'error': 'Admin access required'}), 403

        # Total statistics
        total_orders = Order.query.count()
        total_revenue = db.session.query(func.sum(Order.total_price)).scalar() or 0
        
        # Today's statistics
        today = datetime.utcnow().date()
        today_start = datetime.combine(today, datetime.min.time())
        
        today_orders = Order.query.filter(Order.created_at >= today_start).count()
        today_revenue = db.session.query(func.sum(Order.total_price))\
            .filter(Order.created_at >= today_start).scalar() or 0
        
        # This month's statistics
        first_day_of_month = datetime.utcnow().replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        
        month_orders = Order.query.filter(Order.created_at >= first_day_of_month).count()
        month_revenue = db.session.query(func.sum(Order.total_price))\
            .filter(Order.created_at >= first_day_of_month).scalar() or 0
        
        # Total products sold
        total_products_sold = db.session.query(func.sum(OrderItem.quantity)).scalar() or 0
        
        # Unique customers
        unique_customers = db.session.query(func.count(func.distinct(Order.user_id))).scalar() or 0
        
        return jsonify({
            'total_orders': total_orders,
            'total_revenue': float(total_revenue),
            'today_orders': today_orders,
            'today_revenue': float(today_revenue),
            'month_orders': month_orders,
            'month_revenue': float(month_revenue),
            'total_products_sold': int(total_products_sold),
            'unique_customers': unique_customers
        }), 200

    except Exception as e:
        return jsonify({'error': f'Failed to fetch statistics: {str(e)}'}), 500