"""
Script to insert an admin user into the Gym database
"""
from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from werkzeug.security import generate_password_hash
from sqlalchemy import func, CheckConstraint
from datetime import datetime
import uuid
from models import User, db

# Initialize Flask app and database
app = Flask(__name__)

DATABASE_URL = 'postgresql://postgres:1289@localhost:5432/Gym'

class Config:
    SQLALCHEMY_DATABASE_URI = DATABASE_URL
    SQLALCHEMY_TRACK_MODIFICATIONS = False

app.config.from_object(Config)
db = SQLAlchemy(app)

def generate_uuid():
    return str(uuid.uuid4())

def insert_admin():
    """Insert an admin user into the database"""
    with app.app_context():
        # Check if admin already exists
        existing_admin = User.query.filter_by(email='admin@gym.com').first()
        if existing_admin:
            print(f"Admin user already exists: {existing_admin.email}")
            return
        
        # Create new admin user
        admin = User(
            user_id=generate_uuid(),
            email='admin@gym.com',
            first_name='Admin',
            last_name='User',
            phone='+1234567890',
            date_of_birth=datetime(1990, 1, 1).date(),
            gender='Other',
            role='Admin',
            is_active=True
        )
        
        # Set password
        admin.set_password('Admin@123')
        
        # Add to database
        try:
            db.session.add(admin)
            db.session.commit()
            print(f"✓ Admin user created successfully!")
            print(f"  Email: {admin.email}")
            print(f"  Password: Admin@123")
            print(f"  User ID: {admin.user_id}")
            print(f"\n⚠ IMPORTANT: Change the default password after first login!")
        except Exception as e:
            db.session.rollback()
            print(f"✗ Error creating admin user: {str(e)}")

if __name__ == '__main__':
    insert_admin()