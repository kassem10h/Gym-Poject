from flask_sqlalchemy import SQLAlchemy
from datetime import datetime, date
from sqlalchemy import func, CheckConstraint
from werkzeug.security import generate_password_hash, check_password_hash
import uuid

db = SQLAlchemy()


def generate_uuid():
    """Generate UUID as string for primary keys"""
    return str(uuid.uuid4())

class User(db.Model):
    __tablename__ = 'users'
    
    user_id = db.Column(db.String(36), primary_key=True, default=generate_uuid)
    email = db.Column(db.String(255), unique=True, nullable=False, index=True)
    password_hash = db.Column(db.String(255), nullable=False)
    first_name = db.Column(db.String(100), nullable=False)
    last_name = db.Column(db.String(100), nullable=False)
    phone = db.Column(db.String(20))
    date_of_birth = db.Column(db.Date)
    gender = db.Column(db.String(20))
    role = db.Column(db.String(20), nullable=False, index=True)  # Member, Trainer, Admin
    created_at = db.Column(db.DateTime(timezone=True), server_default=func.now())
    updated_at = db.Column(db.DateTime(timezone=True), onupdate=func.now())
    is_active = db.Column(db.Boolean, default=True)
    
    __table_args__ = (
        CheckConstraint("gender IN ('Male', 'Female', 'Other')", name='check_gender'),
        CheckConstraint("role IN ('Member', 'Trainer', 'Admin')", name='check_role'),
    )
    
    def set_password(self, raw_password):
        """Hash and set password"""
        self.password_hash = generate_password_hash(raw_password)
    
    def check_password(self, raw_password):
        """Verify password"""
        return check_password_hash(self.password_hash, raw_password)

    def __repr__(self):
        return f'<User {self.email} ({self.role})>'
    
class Trainer(db.Model):
    __tablename__ = 'trainers'
    
    trainer_id = db.Column(db.String(36), primary_key=True, default=generate_uuid)
    user_id = db.Column(db.String(36), db.ForeignKey('users.user_id'), nullable=False, unique=True)
    
    years_of_experience = db.Column(db.Integer)
    hourly_rate = db.Column(db.Numeric(10, 2)) 
    specialization = db.Column(db.String(255))
    bio = db.Column(db.Text)
    
    height = db.Column(db.Numeric(5, 2))
    weight = db.Column(db.Numeric(5, 2))
    
    profile_picture_url = db.Column(db.String(500))
    
    certifications = db.Column(db.Text)
    
    created_at = db.Column(db.DateTime(timezone=True), server_default=func.now())
    updated_at = db.Column(db.DateTime(timezone=True), onupdate=func.now())
    
    user = db.relationship('User', backref=db.backref('trainer_profile', uselist=False))
    
    def __repr__(self):
        return f'<Trainer {self.trainer_id} - User {self.user_id}>'
    
class ProductCategory(db.Model):
    __tablename__ = 'product_category'
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), unique=True, nullable=False)
    slug = db.Column(db.String(255), unique=True, nullable=False)
    
    
class Products(db.Model):
    __tablename__ = 'products'
    
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(255), nullable=False)
    description = db.Column(db.Text, nullable=False)
    rating = db.Column(db.Float, nullable=False, default=0.0)
    price = db.Column(db.Float, nullable=False)
    images = db.Column(db.ARRAY(db.String), nullable=True)
    created_at = db.Column(db.DateTime(timezone=True), server_default=func.now())
    updated_at = db.Column(db.DateTime(timezone=True), onupdate=func.now())
    is_active = db.Column(db.Boolean, default=True)

    product_category_id = db.Column(db.Integer, db.ForeignKey('product_category.id'), nullable=False)

    # Relationships
    category = db.relationship('ProductCategory', backref=db.backref('products', lazy=True))

class ProductRating(db.Model):
    __tablename__ = 'product_ratings'
    
    id = db.Column(db.Integer, primary_key=True)
    product_id = db.Column(db.Integer, db.ForeignKey('products.id'), nullable=False)
    user_id = db.Column(db.String(36), db.ForeignKey('users.user_id'), nullable=False)
    rating = db.Column(db.Float, nullable=False)  # 1-5 stars
    review = db.Column(db.Text)
    created_at = db.Column(db.DateTime(timezone=True), server_default=func.now())
    updated_at = db.Column(db.DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    product = db.relationship('Products', backref=db.backref('ratings', lazy=True))
    user = db.relationship('User', backref=db.backref('product_ratings', lazy=True))
    
    # Ensure one rating per user per product
    __table_args__ = (
        db.UniqueConstraint('product_id', 'user_id', name='unique_product_user_rating'),
        db.CheckConstraint('rating >= 1 AND rating <= 5', name='check_product_rating_range'),
    )
    
    def __repr__(self):
        return f'<ProductRating product_id={self.product_id} user_id={self.user_id} rating={self.rating}>'

class EqipmentCategory(db.Model):
    __tablename__ = 'equipment_category'
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), unique=True, nullable=False)
    slug = db.Column(db.String(255), unique=True, nullable=False)

class Equipments(db.Model):
    __tablename__ = 'equipments'
    
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(255), nullable=False)
    description = db.Column(db.Text, nullable=False)
    images = db.Column(db.ARRAY(db.String), nullable=True)
    rating = db.Column(db.Float, nullable=False, server_default="0")
    created_at = db.Column(db.DateTime(timezone=True), server_default=func.now())
    updated_at = db.Column(db.DateTime(timezone=True), onupdate=func.now())
    is_active = db.Column(db.Boolean, default=True)

    equipment_category_id = db.Column(db.Integer, db.ForeignKey('equipment_category.id'), nullable=False)

    # Relationships
    category = db.relationship('EqipmentCategory', backref=db.backref('equipments', lazy=True))

class EquipmentRating(db.Model):
    __tablename__ = 'equipment_ratings'
    
    id = db.Column(db.Integer, primary_key=True)
    equipment_id = db.Column(db.Integer, db.ForeignKey('equipments.id'), nullable=False)
    user_id = db.Column(db.String(36), db.ForeignKey('users.user_id'), nullable=False)
    rating = db.Column(db.Float, nullable=False)  # 1-5 stars
    review = db.Column(db.Text)
    created_at = db.Column(db.DateTime(timezone=True), server_default=func.now())
    updated_at = db.Column(db.DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    equipment = db.relationship('Equipments', backref=db.backref('ratings', lazy=True))
    user = db.relationship('User', backref=db.backref('equipment_ratings', lazy=True))
    
    # Ensure one rating per user per equipment
    __table_args__ = (
        db.UniqueConstraint('equipment_id', 'user_id', name='unique_equipment_user_rating'),
        db.CheckConstraint('rating >= 1 AND rating <= 5', name='check_equipment_rating_range'),
    )
    
    def __repr__(self):
        return f'<EquipmentRating equipment_id={self.equipment_id} user_id={self.user_id} rating={self.rating}>'

# Class/Session Type
class ClassType(db.Model):
    __tablename__ = 'class_types'

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), unique=True, nullable=False)
    description = db.Column(db.Text)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

# Trainer Session
class TrainerSession(db.Model):
    __tablename__ = 'trainer_sessions'

    id = db.Column(db.Integer, primary_key=True)
    trainer_id = db.Column(
        db.String(36),
        db.ForeignKey('users.user_id'),
        nullable=False
    )
    class_type_id = db.Column(
        db.Integer,
        db.ForeignKey('class_types.id'),
        nullable=False
    )
    date = db.Column(db.Date, nullable=False)
    start_time = db.Column(db.Time, nullable=False)
    end_time = db.Column(db.Time, nullable=False)
    price = db.Column(db.Float, nullable=False)
    max_members = db.Column(db.Integer, nullable=False)
    current_bookings = db.Column(db.Integer, default=0)
    is_active = db.Column(db.Boolean, default=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    trainer = db.relationship('User', backref='sessions')
    class_type = db.relationship('ClassType')

    @property
    def is_full(self):
        return self.current_bookings >= self.max_members

    @property
    def spots_remaining(self):
        return self.max_members - self.current_bookings

# Booking - members book into sessions
class Booking(db.Model):
    __tablename__ = 'bookings'

    id = db.Column(db.Integer, primary_key=True)
    member_id = db.Column(
        db.String(36),
        db.ForeignKey('users.user_id'),
        nullable=False
    )
    session_id = db.Column(
        db.Integer,
        db.ForeignKey('trainer_sessions.id'),
        nullable=False
    )
    status = db.Column(db.String(20), default='confirmed')  # confirmed, cancelled, completed
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, onupdate=datetime.utcnow)

    member = db.relationship('User', backref='bookings')
    session = db.relationship('TrainerSession', backref='bookings')

# Cart (cart is temporary, order is permanent)
class Cart(db.Model):
    __tablename__ = 'carts'

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.String(36), db.ForeignKey('users.user_id'), nullable=False)
    created_at = db.Column(db.DateTime, server_default=func.now())

class CartItem(db.Model):
    __tablename__ = 'cart_items'

    id = db.Column(db.Integer, primary_key=True)
    cart_id = db.Column(db.Integer, db.ForeignKey('carts.id'), nullable=False)
    product_id = db.Column(db.Integer, db.ForeignKey('products.id'), nullable=False)
    quantity = db.Column(db.Integer, default=1)

    product = db.relationship('Products')

# Order and Order Items (after checkout)
class Order(db.Model):
    __tablename__ = 'orders'

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.String(36), db.ForeignKey('users.user_id'), nullable=False)
    total_price = db.Column(db.Float, nullable=False)
    created_at = db.Column(db.DateTime, server_default=func.now())

class OrderItem(db.Model):
    __tablename__ = 'order_items'

    id = db.Column(db.Integer, primary_key=True)
    order_id = db.Column(db.Integer, db.ForeignKey('orders.id'), nullable=False)
    product_id = db.Column(db.Integer, db.ForeignKey('products.id'), nullable=False)
    quantity = db.Column(db.Integer, default=1)
    price_at_purchase = db.Column(db.Float, nullable=False)

class SessionCart(db.Model):
    __tablename__ = 'session_carts'

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.String(36), db.ForeignKey('users.user_id'), nullable=False)
    created_at = db.Column(db.DateTime, server_default=func.now())

    user = db.relationship('User', backref='session_cart')


class SessionCartItem(db.Model):
    __tablename__ = 'session_cart_items'

    id = db.Column(db.Integer, primary_key=True)
    cart_id = db.Column(db.Integer, db.ForeignKey('session_carts.id'), nullable=False)
    session_id = db.Column(db.Integer, db.ForeignKey('trainer_sessions.id'), nullable=False)
    created_at = db.Column(db.DateTime, server_default=func.now())

    cart = db.relationship('SessionCart', backref='items')
    session = db.relationship('TrainerSession')

    # Ensure a user can't add the same session twice to their cart
    __table_args__ = (
        db.UniqueConstraint('cart_id', 'session_id', name='unique_session_per_cart'),
    )
    

class Membership(db.Model):
    __tablename__ = 'memberships'

    id = db.Column(db.Integer, primary_key=True)

    user_id = db.Column(db.String(36), db.ForeignKey('users.user_id'), nullable=False)

    membership_type = db.Column(db.String(50), nullable=False)  
    # e.g. Monthly, Quarterly, Yearly, Premium, Studnet

    start_date = db.Column(db.Date, nullable=False)
    end_date = db.Column(db.Date, nullable=False)
    is_active = db.Column(db.Boolean, default=True)

    created_at = db.Column(db.DateTime, server_default=func.now())

class Notification(db.Model):
    __tablename__ = 'notifications'

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.String(36), db.ForeignKey('users.user_id'), nullable=False)
    message = db.Column(db.Text, nullable=False)
    is_read = db.Column(db.Boolean, default=False)
    link = db.Column(db.String(255), nullable=True)  # Optional link related to the notification
    created_at = db.Column(db.DateTime, server_default=func.now())
