import os
from flask import Flask, jsonify
from flask_cors import CORS
from flask_sqlalchemy import SQLAlchemy
from backend.config import Config

db = SQLAlchemy()

def create_app(config_class=Config):
    app = Flask(__name__)
    app.config.from_object(config_class)
    
    # Initialize extensions
    CORS(app, resources={r"/api/*": {"origins": "*"}})
    db.init_app(app)
    
    # Register blueprints
    from backend.app.routes.auth_routes import auth_bp
    from backend.app.routes.income_routes import income_bp
    from backend.app.routes.expense_routes import expense_bp
    from backend.app.routes.budget_routes import budget_bp
    from backend.app.routes.goal_routes import goal_bp
    from backend.app.routes.dashboard_routes import dashboard_bp
    from backend.app.routes.ai_routes import ai_bp
    from backend.app.routes.report_routes import report_bp
    
    app.register_blueprint(auth_bp, url_prefix="/api/auth")
    app.register_blueprint(income_bp, url_prefix="/api/income")
    app.register_blueprint(expense_bp, url_prefix="/api/expenses")
    app.register_blueprint(budget_bp, url_prefix="/api/budgets")
    app.register_blueprint(goal_bp, url_prefix="/api/goals")
    app.register_blueprint(dashboard_bp, url_prefix="/api/dashboard")
    app.register_blueprint(ai_bp, url_prefix="/api/ai")
    app.register_blueprint(report_bp, url_prefix="/api/reports")
    
    @app.route("/api/health", methods=["GET"])
    def health():
        return jsonify({"status": "ok", "service": "Personal Finance Advisor API"}), 200
        
    # Global error handlers
    @app.errorhandler(400)
    def bad_request(e):
        return jsonify({"error": "Bad request", "message": str(e)}), 400

    @app.errorhandler(404)
    def not_found(e):
        return jsonify({"error": "Resource not found", "message": str(e)}), 404

    @app.errorhandler(500)
    def server_error(e):
        return jsonify({"error": "Internal server error", "message": "An unexpected error occurred."}), 500
        
    return app
