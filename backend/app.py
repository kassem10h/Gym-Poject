import os
from flask import Flask, abort, request, redirect, url_for, jsonify
from sqlalchemy import func
from config import Config
from sqlalchemy.exc import SQLAlchemyError
from datetime import datetime, timedelta
from models import db
from flask_cors import CORS
import pytz
from flask import send_from_directory, current_app
from flask_jwt_extended import JWTManager
from blueprints.Auth import auth_bp
from blueprints.admin.admin import admin_bp
from blueprints.admin.admin_users import admin_users_bp
from blueprints.admin.analytics import analytics_bp
from blueprints.admin.orders import orders_bp
from blueprints.admin.bookings import bookings_bp
from blueprints.admin.admin_trainers import admin_trainers_bp
from blueprints.members.shop import shop_bp
from blueprints.members.cart import cart_bp
from blueprints.members.session_cart import session_cart_bp
from blueprints.trainer.sessions import session_bp
from blueprints.trainer.trainer_profile import trainer_profile_bp
from blueprints.members.checkout import checkout_bp
from blueprints.members.membership import membership_bp
from blueprints.members.profile import profile_bp
from blueprints.notifications.notifications_bp import notifications_bp

app = Flask(__name__)

app.config['SECRET_KEY'] = '1289'
app.config['JWT_SECRET_KEY'] = '1289' 
app.config["JWT_ACCESS_TOKEN_EXPIRES"] = timedelta(minutes=60)

jwt = JWTManager(app)

# Load other config
app.config.from_object(Config)
db.init_app(app)
lebanon_tz = pytz.timezone("Asia/Beirut")

CORS(
    app,
    supports_credentials=True,
    allow_headers=["Authorization", "Content-Type", "X-CSRF-TOKEN"],
    resources={
        r"/api/*": {
            "origins": [
                "http://localhost:5173",
            ],
            "allow_headers": ["Authorization", "Content-Type", "X-CSRF-TOKEN"],
            "expose_headers": ["Authorization"],
            "methods": ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"]
        },
    }
)

@app.before_request
def handle_preflight():
    if request.method == "OPTIONS":
        response = jsonify({})
        response.headers["Access-Control-Allow-Origin"] = "http://localhost:5173"
        response.headers["Access-Control-Allow-Headers"] = "Authorization, Content-Type, X-CSRF-TOKEN"
        response.headers["Access-Control-Allow-Methods"] = "GET, POST, PUT, DELETE, PATCH, OPTIONS"
        return response

# JWT Error Handlers for better debugging
@jwt.unauthorized_loader
def unauthorized_callback(callback):
    return jsonify({
        'error': 'Missing Authorization Header',
        'message': 'Request does not contain an access token'
    }), 401

@jwt.invalid_token_loader
def invalid_token_callback(callback):
    return jsonify({
        'error': 'Invalid token',
        'message': 'Token verification failed. Please log in again.'
    }), 422

@jwt.expired_token_loader
def expired_token_callback(jwt_header, jwt_payload):
    return jsonify({
        'error': 'Token has expired',
        'message': 'Please log in again'
    }), 401

@jwt.revoked_token_loader
def revoked_token_callback(jwt_header, jwt_payload):
    return jsonify({
        'error': 'Token has been revoked',
        'message': 'Please log in again'
    }), 401

@app.route('/uploads/<path:filename>')
def uploaded_file(filename):
    upload_folder = os.path.join(current_app.root_path, 'uploads')
    return send_from_directory(upload_folder, filename)


app.register_blueprint(auth_bp)
app.register_blueprint(admin_bp)
app.register_blueprint(admin_users_bp)
app.register_blueprint(admin_trainers_bp)
app.register_blueprint(analytics_bp)
app.register_blueprint(bookings_bp)
app.register_blueprint(orders_bp)
app.register_blueprint(shop_bp)
app.register_blueprint(cart_bp)
app.register_blueprint(session_bp)
app.register_blueprint(session_cart_bp)
app.register_blueprint(checkout_bp)
app.register_blueprint(membership_bp)
app.register_blueprint(notifications_bp)
app.register_blueprint(trainer_profile_bp)
app.register_blueprint(profile_bp)

if __name__ == "__main__":
    with app.app_context():
        db.create_all() 
    app.run(debug=True, host='0.0.0.0', port=8000)