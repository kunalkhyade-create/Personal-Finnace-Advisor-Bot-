import re
from flask import Blueprint, request, jsonify
from backend.app import db
from backend.app.models.models import User
from backend.app.utils.auth_helper import generate_token, token_required

auth_bp = Blueprint("auth", __name__)

EMAIL_REGEX = r"^[\w\.-]+@[\w\.-]+\.\w+$"

@auth_bp.route("/register", methods=["POST"])
def register():
    data = request.get_json() or {}
    name = data.get("name", "").strip()
    email = data.get("email", "").strip().lower()
    password = data.get("password", "")
    persona = data.get("persona", "Salaried")

    # Validation
    if not name:
        return jsonify({"error": "Validation Error", "message": "Name is required."}), 400

    if not email or not re.match(EMAIL_REGEX, email):
        return jsonify({"error": "Validation Error", "message": "Please provide a valid email address."}), 400

    if not password or len(password) < 6:
        return jsonify({"error": "Validation Error", "message": "Password must be at least 6 characters long."}), 400

    if User.query.filter_by(email=email).first():
        return jsonify({"error": "Conflict", "message": "An account with this email already exists."}), 409

    try:
        user = User(
            name=name,
            email=email,
            persona=persona,
            currency="INR"
        )
        user.set_password(password)
        db.session.add(user)
        db.session.commit()

        token = generate_token(user.id)
        return jsonify({
            "message": "Registration successful!",
            "token": token,
            "user": user.to_dict()
        }), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": "Server Error", "message": "Could not register user. Please try again."}), 500


@auth_bp.route("/login", methods=["POST"])
def login():
    data = request.get_json() or {}
    email = data.get("email", "").strip().lower()
    password = data.get("password", "")

    if not email or not password:
        return jsonify({"error": "Validation Error", "message": "Email and password are required."}), 400

    user = User.query.filter_by(email=email).first()
    if not user or not user.check_password(password):
        return jsonify({"error": "Unauthorized", "message": "Invalid email or password."}), 401

    token = generate_token(user.id)
    return jsonify({
        "message": "Login successful!",
        "token": token,
        "user": user.to_dict()
    }), 200


@auth_bp.route("/logout", methods=["POST"])
def logout():
    # Client will clear the JWT token
    return jsonify({"message": "Logged out successfully."}), 200


@auth_bp.route("/me", methods=["GET"])
@token_required
def get_me(current_user):
    return jsonify({"user": current_user.to_dict()}), 200


@auth_bp.route("/profile", methods=["PUT"])
@token_required
def update_profile(current_user):
    data = request.get_json() or {}
    name = data.get("name")
    persona = data.get("persona")
    currency = data.get("currency")
    new_password = data.get("password")

    if name:
        current_user.name = name.strip()
    if persona:
        current_user.persona = persona.strip()
    if currency:
        current_user.currency = currency.strip()
    if new_password:
        if len(new_password) < 6:
            return jsonify({"error": "Validation Error", "message": "Password must be at least 6 characters long."}), 400
        current_user.set_password(new_password)

    db.session.commit()
    return jsonify({
        "message": "Profile updated successfully.",
        "user": current_user.to_dict()
    }), 200
