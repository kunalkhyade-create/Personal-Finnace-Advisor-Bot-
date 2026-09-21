from datetime import date
from flask import Blueprint, request, jsonify
from backend.app import db
from backend.app.models.models import Budget
from backend.app.services.finance_service import FinanceService
from backend.app.utils.auth_helper import token_required

budget_bp = Blueprint("budgets", __name__)

@budget_bp.route("", methods=["GET"])
@token_required
def get_budgets(current_user):
    today = date.today()
    month = request.args.get("month", default=today.month, type=int)
    year = request.args.get("year", default=today.year, type=int)

    status = FinanceService.get_budget_status(current_user.id, month, year)
    return jsonify(status), 200


@budget_bp.route("", methods=["POST"])
@token_required
def create_or_update_budget(current_user):
    data = request.get_json() or {}
    category = data.get("category", "").strip()
    monthly_limit = data.get("monthly_limit")
    today = date.today()
    month = data.get("month", today.month)
    year = data.get("year", today.year)

    try:
        monthly_limit = float(monthly_limit)
        if monthly_limit <= 0:
            return jsonify({"error": "Validation Error", "message": "Budget limit must be greater than 0."}), 400
    except (TypeError, ValueError):
        return jsonify({"error": "Validation Error", "message": "Please enter a valid numeric budget limit."}), 400

    if not category:
        return jsonify({"error": "Validation Error", "message": "Category is required."}), 400

    try:
        month = int(month)
        year = int(year)
        if month < 1 or month > 12:
            return jsonify({"error": "Validation Error", "message": "Month must be between 1 and 12."}), 400
    except (TypeError, ValueError):
        return jsonify({"error": "Validation Error", "message": "Invalid month or year."}), 400

    # Check if budget already exists for this category/month/year (upsert)
    budget = Budget.query.filter_by(
        user_id=current_user.id,
        category=category,
        month=month,
        year=year
    ).first()

    if budget:
        budget.monthly_limit = monthly_limit
        message = f"Budget for {category} updated to ₹{monthly_limit:,.0f}."
    else:
        budget = Budget(
            user_id=current_user.id,
            category=category,
            monthly_limit=monthly_limit,
            month=month,
            year=year
        )
        db.session.add(budget)
        message = f"Budget of ₹{monthly_limit:,.0f} set for {category}."

    db.session.commit()

    # Return refreshed budget status
    status = FinanceService.get_budget_status(current_user.id, month, year)
    return jsonify({
        "message": message,
        "budget": budget.to_dict(),
        "status": status
    }), 201 if not budget else 200


@budget_bp.route("/<int:budget_id>", methods=["PUT"])
@token_required
def update_budget(current_user, budget_id):
    budget = Budget.query.filter_by(id=budget_id, user_id=current_user.id).first()
    if not budget:
        return jsonify({"error": "Not Found", "message": "Budget record not found."}), 404

    data = request.get_json() or {}
    if "monthly_limit" in data:
        try:
            limit = float(data["monthly_limit"])
            if limit <= 0:
                return jsonify({"error": "Validation Error", "message": "Limit must be greater than 0."}), 400
            budget.monthly_limit = limit
        except (TypeError, ValueError):
            return jsonify({"error": "Validation Error", "message": "Invalid numeric limit."}), 400

    if "category" in data and data["category"].strip():
        budget.category = data["category"].strip()

    db.session.commit()
    return jsonify({
        "message": "Budget updated successfully.",
        "budget": budget.to_dict()
    }), 200


@budget_bp.route("/<int:budget_id>", methods=["DELETE"])
@token_required
def delete_budget(current_user, budget_id):
    budget = Budget.query.filter_by(id=budget_id, user_id=current_user.id).first()
    if not budget:
        return jsonify({"error": "Not Found", "message": "Budget record not found."}), 404

    db.session.delete(budget)
    db.session.commit()
    return jsonify({"message": "Budget limit removed successfully."}), 200


@budget_bp.route("/batch", methods=["POST"])
@token_required
def save_batch_budgets(current_user):
    """
    Accepts an array of budget recommendations (from AI Budget generator) and saves them in bulk.
    """
    data = request.get_json() or {}
    budgets_list = data.get("budgets", [])
    today = date.today()
    month = data.get("month", today.month)
    year = data.get("year", today.year)

    saved_count = 0
    for b in budgets_list:
        cat = b.get("category", "").strip()
        limit = b.get("recommended_budget") or b.get("monthly_limit")
        if not cat or not limit:
            continue
        try:
            limit = float(limit)
            if limit <= 0:
                continue
        except (TypeError, ValueError):
            continue

        existing = Budget.query.filter_by(
            user_id=current_user.id,
            category=cat,
            month=month,
            year=year
        ).first()

        if existing:
            existing.monthly_limit = limit
        else:
            new_b = Budget(
                user_id=current_user.id,
                category=cat,
                monthly_limit=limit,
                month=month,
                year=year
            )
            db.session.add(new_b)
        saved_count += 1

    db.session.commit()
    status = FinanceService.get_budget_status(current_user.id, month, year)
    return jsonify({
        "message": f"Successfully applied {saved_count} budget limits.",
        "status": status
    }), 200
