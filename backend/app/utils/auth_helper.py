import jwt
import os
from datetime import datetime, timedelta
from functools import wraps
from flask import request, jsonify, current_app
from backend.app.models.models import User

def generate_token(user_id):
    """
    Generates a secure JWT access token valid for 7 days.
    """
    secret = current_app.config.get("JWT_SECRET_KEY", "jwt-secret-key-finance-bot-99")
    payload = {
        "user_id": user_id,
        "exp": datetime.utcnow() + timedelta(days=7),
        "iat": datetime.utcnow()
    }
    return jwt.encode(payload, secret, algorithm="HS256")

def token_required(f):
    """
    Decorator for protecting routes with JWT bearer authentication.
    """
    @wraps(f)
    def decorated(*args, **kwargs):
        token = None
        auth_header = request.headers.get("Authorization")

        if auth_header:
            parts = auth_header.split()
            if len(parts) == 2 and parts[0].lower() == "bearer":
                token = parts[1]
            elif len(parts) == 1:
                token = parts[0]

        if not token:
            return jsonify({"error": "Unauthorized", "message": "Authentication token is missing. Please log in."}), 401

        try:
            secret = current_app.config.get("JWT_SECRET_KEY", "jwt-secret-key-finance-bot-99")
            payload = jwt.decode(token, secret, algorithms=["HS256"])
            from backend.app import db
            current_user = db.session.get(User, payload["user_id"])
            if not current_user:
                return jsonify({"error": "Unauthorized", "message": "User associated with token no longer exists."}), 401
        except jwt.ExpiredSignatureError:
            return jsonify({"error": "Unauthorized", "message": "Session expired. Please log in again."}), 401
        except (jwt.InvalidTokenError, Exception) as e:
            return jsonify({"error": "Unauthorized", "message": "Invalid authentication token."}), 401

        return f(current_user, *args, **kwargs)

    return decorated
