from datetime import date
from flask import Blueprint, request, jsonify
from backend.app import db
from backend.app.models.models import AIConversation
from backend.app.services.ai_service import AIService
from backend.app.utils.auth_helper import token_required

ai_bp = Blueprint("ai", __name__)

@ai_bp.route("/analyze", methods=["POST"])
@token_required
def analyze_finances(current_user):
    data = request.get_json() or {}
    today = date.today()
    month = data.get("month", today.month)
    year = data.get("year", today.year)

    analysis = AIService.generate_rule_based_analysis(current_user, month=month, year=year)
    return jsonify(analysis), 200


@ai_bp.route("/generate-budget", methods=["POST"])
@token_required
def generate_budget(current_user):
    data = request.get_json() or {}
    monthly_income = data.get("monthly_income")
    if monthly_income is not None:
        try:
            monthly_income = float(monthly_income)
        except (TypeError, ValueError):
            monthly_income = None

    plan = AIService.generate_personalized_budget(current_user.id, monthly_income)
    return jsonify(plan), 200


@ai_bp.route("/chat", methods=["POST"])
@token_required
def chat(current_user):
    data = request.get_json() or {}
    message = data.get("message", "").strip()

    if not message:
        return jsonify({"error": "Validation Error", "message": "Message cannot be empty."}), 400

    # Save user message to conversation history
    user_conv = AIConversation(
        user_id=current_user.id,
        role="user",
        content=message
    )
    db.session.add(user_conv)

    # Process AI answer
    ai_result = AIService.answer_chat(current_user, message)

    # Save assistant message
    ai_conv = AIConversation(
        user_id=current_user.id,
        role="assistant",
        content=ai_result["reply"]
    )
    db.session.add(ai_conv)
    db.session.commit()

    return jsonify({
        "reply": ai_result["reply"],
        "is_ai_powered": ai_result["is_ai_powered"],
        "disclaimer": ai_result["disclaimer"]
    }), 200


@ai_bp.route("/chat/history", methods=["GET"])
@token_required
def get_chat_history(current_user):
    limit = request.args.get("limit", default=30, type=int)
    conversations = AIConversation.query.filter_by(user_id=current_user.id).order_by(AIConversation.created_at.asc()).limit(limit).all()
    return jsonify({"history": [c.to_dict() for c in conversations]}), 200


@ai_bp.route("/chat/history", methods=["DELETE"])
@token_required
def clear_chat_history(current_user):
    AIConversation.query.filter_by(user_id=current_user.id).delete()
    db.session.commit()
    return jsonify({"message": "Conversation history cleared."}), 200
