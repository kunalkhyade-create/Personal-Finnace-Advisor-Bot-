from datetime import datetime, date
from flask import Blueprint, request, jsonify
from backend.app import db
from backend.app.models.models import FinancialGoal
from backend.app.utils.auth_helper import token_required

goal_bp = Blueprint("goals", __name__)

@goal_bp.route("", methods=["GET"])
@token_required
def get_goals(current_user):
    goals = FinancialGoal.query.filter_by(user_id=current_user.id).order_by(FinancialGoal.created_at.desc()).all()
    total_target = sum(g.target_amount for g in goals)
    total_saved = sum(g.current_amount for g in goals)
    overall_progress = round((total_saved / total_target * 100), 1) if total_target > 0 else 0.0

    return jsonify({
        "total_target": round(total_target, 2),
        "total_saved": round(total_saved, 2),
        "overall_progress": overall_progress,
        "count": len(goals),
        "goals": [g.to_dict() for g in goals]
    }), 200


@goal_bp.route("", methods=["POST"])
@token_required
def create_goal(current_user):
    data = request.get_json() or {}
    goal_name = data.get("goal_name", "").strip()
    target_amount = data.get("target_amount")
    current_amount = data.get("current_amount", 0.0)
    target_date_str = data.get("target_date")
    description = data.get("description", "").strip()

    if not goal_name:
        return jsonify({"error": "Validation Error", "message": "Goal name is required."}), 400

    try:
        target_amount = float(target_amount)
        if target_amount <= 0:
            return jsonify({"error": "Validation Error", "message": "Target amount must be greater than 0."}), 400
    except (TypeError, ValueError):
        return jsonify({"error": "Validation Error", "message": "Please enter a valid numeric target amount."}), 400

    try:
        current_amount = float(current_amount) if current_amount else 0.0
        if current_amount < 0:
            return jsonify({"error": "Validation Error", "message": "Current amount cannot be negative."}), 400
    except (TypeError, ValueError):
        return jsonify({"error": "Validation Error", "message": "Invalid current amount."}), 400

    target_date = None
    if target_date_str:
        try:
            target_date = datetime.strptime(target_date_str, "%Y-%m-%d").date()
        except ValueError:
            return jsonify({"error": "Validation Error", "message": "Invalid target date. Format: YYYY-MM-DD."}), 400

    goal = FinancialGoal(
        user_id=current_user.id,
        goal_name=goal_name,
        target_amount=target_amount,
        current_amount=current_amount,
        target_date=target_date,
        description=description
    )
    db.session.add(goal)
    db.session.commit()

    return jsonify({
        "message": f"Financial goal '{goal_name}' created successfully!",
        "goal": goal.to_dict()
    }), 201


@goal_bp.route("/<int:goal_id>", methods=["PUT"])
@token_required
def update_goal(current_user, goal_id):
    goal = FinancialGoal.query.filter_by(id=goal_id, user_id=current_user.id).first()
    if not goal:
        return jsonify({"error": "Not Found", "message": "Goal not found."}), 404

    data = request.get_json() or {}
    if "goal_name" in data and data["goal_name"].strip():
        goal.goal_name = data["goal_name"].strip()

    if "target_amount" in data:
        try:
            t = float(data["target_amount"])
            if t <= 0:
                return jsonify({"error": "Validation Error", "message": "Target amount must be greater than 0."}), 400
            goal.target_amount = t
        except (TypeError, ValueError):
            return jsonify({"error": "Validation Error", "message": "Invalid target amount."}), 400

    if "current_amount" in data:
        try:
            c = float(data["current_amount"])
            if c < 0:
                return jsonify({"error": "Validation Error", "message": "Current amount cannot be negative."}), 400
            goal.current_amount = c
        except (TypeError, ValueError):
            return jsonify({"error": "Validation Error", "message": "Invalid current amount."}), 400

    if "target_date" in data:
        if data["target_date"]:
            try:
                goal.target_date = datetime.strptime(data["target_date"], "%Y-%m-%d").date()
            except ValueError:
                return jsonify({"error": "Validation Error", "message": "Invalid date format. Use YYYY-MM-DD."}), 400
        else:
            goal.target_date = None

    if "description" in data:
        goal.description = data["description"].strip()

    db.session.commit()
    return jsonify({
        "message": "Goal updated successfully.",
        "goal": goal.to_dict()
    }), 200


@goal_bp.route("/<int:goal_id>/progress", methods=["PATCH"])
@token_required
def update_progress(current_user, goal_id):
    """
    Quickly add funds to a financial goal.
    """
    goal = FinancialGoal.query.filter_by(id=goal_id, user_id=current_user.id).first()
    if not goal:
        return jsonify({"error": "Not Found", "message": "Goal not found."}), 404

    data = request.get_json() or {}
    add_amount = data.get("add_amount")
    set_amount = data.get("set_amount")

    if add_amount is not None:
        try:
            val = float(add_amount)
            if val <= 0:
                return jsonify({"error": "Validation Error", "message": "Amount added must be greater than 0."}), 400
            goal.current_amount += val
        except (TypeError, ValueError):
            return jsonify({"error": "Validation Error", "message": "Invalid number."}), 400
    elif set_amount is not None:
        try:
            val = float(set_amount)
            if val < 0:
                return jsonify({"error": "Validation Error", "message": "Current amount cannot be negative."}), 400
            goal.current_amount = val
        except (TypeError, ValueError):
            return jsonify({"error": "Validation Error", "message": "Invalid number."}), 400
    else:
        return jsonify({"error": "Validation Error", "message": "Provide either add_amount or set_amount."}), 400

    db.session.commit()
    return jsonify({
        "message": f"Updated savings for '{goal.goal_name}'. Now at ₹{goal.current_amount:,.0f}!",
        "goal": goal.to_dict()
    }), 200


@goal_bp.route("/<int:goal_id>", methods=["DELETE"])
@token_required
def delete_goal(current_user, goal_id):
    goal = FinancialGoal.query.filter_by(id=goal_id, user_id=current_user.id).first()
    if not goal:
        return jsonify({"error": "Not Found", "message": "Goal not found."}), 404

    db.session.delete(goal)
    db.session.commit()
    return jsonify({"message": "Goal deleted successfully."}), 200
