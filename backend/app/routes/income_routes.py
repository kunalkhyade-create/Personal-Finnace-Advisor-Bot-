from datetime import datetime, date
from flask import Blueprint, request, jsonify
from sqlalchemy import extract
from backend.app import db
from backend.app.models.models import Income
from backend.app.utils.auth_helper import token_required

income_bp = Blueprint("income", __name__)

DEFAULT_SOURCES = ["Salary", "Freelancing", "Part-time job", "Business", "Scholarship", "Allowance", "Investment", "Other"]

@income_bp.route("", methods=["GET"])
@token_required
def get_incomes(current_user):
    month = request.args.get("month", type=int)
    year = request.args.get("year", type=int)
    source = request.args.get("source", type=str)

    query = Income.query.filter_by(user_id=current_user.id)

    if month:
        query = query.filter(extract('month', Income.date) == month)
    if year:
        query = query.filter(extract('year', Income.date) == year)
    if source:
        query = query.filter(Income.source.ilike(f"%{source}%"))

    incomes = query.order_by(Income.date.desc(), Income.created_at.desc()).all()
    total = sum(i.amount for i in incomes)

    return jsonify({
        "total_amount": round(total, 2),
        "count": len(incomes),
        "incomes": [i.to_dict() for i in incomes]
    }), 200


@income_bp.route("", methods=["POST"])
@token_required
def create_income(current_user):
    data = request.get_json() or {}
    amount = data.get("amount")
    source = data.get("source", "").strip()
    income_type = data.get("income_type", "Recurring").strip()
    date_str = data.get("date")
    description = data.get("description", "").strip()

    # Validation
    try:
        amount = float(amount)
        if amount <= 0:
            return jsonify({"error": "Validation Error", "message": "Income amount must be greater than 0."}), 400
    except (TypeError, ValueError):
        return jsonify({"error": "Validation Error", "message": "Please enter a valid numeric amount."}), 400

    if not source:
        return jsonify({"error": "Validation Error", "message": "Income source is required."}), 400

    income_date = date.today()
    if date_str:
        try:
            income_date = datetime.strptime(date_str, "%Y-%m-%d").date()
        except ValueError:
            return jsonify({"error": "Validation Error", "message": "Invalid date format. Use YYYY-MM-DD."}), 400

    income = Income(
        user_id=current_user.id,
        amount=amount,
        source=source,
        income_type=income_type,
        date=income_date,
        description=description
    )
    db.session.add(income)
    db.session.commit()

    return jsonify({
        "message": "Income added successfully.",
        "income": income.to_dict()
    }), 201


@income_bp.route("/<int:income_id>", methods=["PUT"])
@token_required
def update_income(current_user, income_id):
    income = Income.query.filter_by(id=income_id, user_id=current_user.id).first()
    if not income:
        return jsonify({"error": "Not Found", "message": "Income record not found."}), 404

    data = request.get_json() or {}
    if "amount" in data:
        try:
            amount = float(data["amount"])
            if amount <= 0:
                return jsonify({"error": "Validation Error", "message": "Income amount must be greater than 0."}), 400
            income.amount = amount
        except (TypeError, ValueError):
            return jsonify({"error": "Validation Error", "message": "Invalid numeric amount."}), 400

    if "source" in data and data["source"].strip():
        income.source = data["source"].strip()

    if "income_type" in data:
        income.income_type = data["income_type"].strip()

    if "date" in data and data["date"]:
        try:
            income.date = datetime.strptime(data["date"], "%Y-%m-%d").date()
        except ValueError:
            return jsonify({"error": "Validation Error", "message": "Invalid date format. Use YYYY-MM-DD."}), 400

    if "description" in data:
        income.description = data["description"].strip()

    db.session.commit()
    return jsonify({
        "message": "Income updated successfully.",
        "income": income.to_dict()
    }), 200


@income_bp.route("/<int:income_id>", methods=["DELETE"])
@token_required
def delete_income(current_user, income_id):
    income = Income.query.filter_by(id=income_id, user_id=current_user.id).first()
    if not income:
        return jsonify({"error": "Not Found", "message": "Income record not found."}), 404

    db.session.delete(income)
    db.session.commit()
    return jsonify({"message": "Income record deleted successfully."}), 200


@income_bp.route("/sources", methods=["GET"])
@token_required
def get_sources(current_user):
    user_sources = db.session.query(Income.source).filter_by(user_id=current_user.id).distinct().all()
    user_source_list = [s[0] for s in user_sources if s[0]]
    combined = sorted(list(set(DEFAULT_SOURCES + user_source_list)))
    return jsonify({"sources": combined}), 200
