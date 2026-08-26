from app.middleware import token_required
import jwt
from datetime import datetime, timedelta
from flask import Blueprint, request, jsonify, current_app
from werkzeug.security import generate_password_hash, check_password_hash
from app.models import User, db

auth_bp = Blueprint('auth', __name__)

@auth_bp.route('/register', methods=['POST'])
def register():
    data = request.get_json()
    
    if not data or not data.get('name') or not data.get('email') or not data.get('password') or not data.get('role'):
        return jsonify({"error": "Name, email, password and role are required"}), 400
    
    if User.query.filter_by(email=data['email']).first():
        return jsonify({"error": "Database error"}), 400
    
    hashed_password = generate_password_hash(data['password'], method='pbkdf2:sha256')
    
    new_user = User(name=data['name'], email=data['email'], password_hash=hashed_password, role=data['role'])
    db.session.add(new_user)
    
    try:
        db.session.commit()
        return jsonify({"message":"User registered successfully!", "user": new_user.to_dict()}), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({"error":"Database error"}), 400

@auth_bp.route('/login', methods=['POST'])
def login():
    data = request.get_json()
    
    if not data or not data.get('email') or not data.get('password'):
        return jsonify({"error": "Email and password are required"}), 400
    
    user = User.query.filter_by(email=data['email']).first()
    
    if not user or not check_password_hash(user.password_hash, data['password']):
        return jsonify({"error": "Invalid email or password"}), 401
    
    token = jwt.encode({
        'user_id': user.id,
        'exp': datetime.utcnow() + timedelta(minutes=30)
    }, current_app.config['SECRET_KEY'], algorithm="HS256")

    return jsonify({
        "message": "Login successful!",
        "token": token,
        "user": user.to_dict()
    }), 200

@auth_bp.route('/logout', methods=['POST'])
def logout(current_user):
    # Because JWT is stateless, the server doesn't need to "do" anything to log the user out.
    # The client is responsible for deleting the token from their local storage/app.
    return jsonify({"message": "Successfully logged out."}), 200

@auth_bp.route('/users', methods=['GET'])
@token_required
def get_users(current_user):
    if current_user.role != 'admin':
        return jsonify({"error": "Unauthorized access"}), 403
    users = User.query.all()
    return jsonify({"users": [user.to_dict() for user in users]}), 200

# @auth_bp.route('/users/<int:user_id>', methods=['PUT'])
# @token_required
# def update_user_role(current_user, user_id):
#     if current_user.role != 'admin':
#         return jsonify({"error": "Unauthorized access"}), 403
#     user = User.query.get(user_id)
#     if not user:
#         return jsonify({"error": "User not found"}), 404
#     data = request.get_json()
#     if 'role' not in data:
#         return jsonify({"error": "Role is required"}), 400
#     user.role = data['role']
#     new_password = data.get('password')
#     if new_password:
#         user.password_hash = generate_password_hash(new_password, method='pbkdf2:sha256')
#     db.session.commit()
#     return jsonify({"message": "User role updated successfully!", "user": user.to_dict()}), 200

@auth_bp.route('/users/<int:user_id>', methods=['PUT'])
@token_required
def update_user(current_user, user_id):
    if current_user.role != 'admin':
        return jsonify({"error": "Unauthorized access"}), 403
    user = User.query.get(user_id)
    if not user:
        return jsonify({"error": "User not found"}), 404
    data = request.get_json()

    changed = False
    if 'role' in data:
        user.role = data['role']
        changed = True
    if 'active' in data:
        user.active = data['active']
        changed = True
    if data.get('password'):
        user.password_hash = generate_password_hash(data['password'], method='pbkdf2:sha256')
        changed = True

    if not changed:
        return jsonify({"error": "Nothing to update"}), 400

    db.session.commit()
    return jsonify({"message": "User updated successfully!", "user": user.to_dict()}), 200

@auth_bp.route('/users/<int:user_id>', methods=['PUT'])
@token_required
def update_user_status(current_user, user_id):
    if current_user.role != 'admin':
        return jsonify({"error": "Unauthorized access"}), 403
    user = User.query.get(user_id)
    if not user:
        return jsonify({"error": "User not found"}), 404
    data = request.get_json()
    if 'active' not in data:
        return jsonify({"error": "Active status is required"}), 400
    user.active = data['active']
    db.session.commit()
    return jsonify({"message": "User status updated successfully!", "user": user.to_dict()}), 200