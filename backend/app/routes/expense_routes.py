from datetime import datetime, date
from flask import Blueprint, request, jsonify
from sqlalchemy import extract, or_, desc, asc
from backend.app import db
from backend.app.models.models import Expense
from backend.app.utils.auth_helper import token_required

expense_bp = Blueprint("expenses", __name__)

DEFAULT_CATEGORIES = [
    "Food", "Rent", "Transport", "Utilities", "Education",
    "Healthcare", "Shopping", "Entertainment", "Bills",
    "Groceries", "Travel", "EMI/Loans", "Personal", "Other"
]

PAYMENT_METHODS = ["UPI", "Credit Card", "Debit Card", "Cash", "Net Banking"]

@expense_bp.route("", methods=["GET"])
@token_required
def get_expenses(current_user):
    month = request.args.get("month", type=int)
    year = request.args.get("year", type=int)
    category = request.args.get("category", type=str)
    search = request.args.get("search", type=str)
    sort_by = request.args.get("sort_by", default="date", type=str) # 'date' or 'amount'
    order = request.args.get("order", default="desc", type=str) # 'asc' or 'desc'

    query = Expense.query.filter_by(user_id=current_user.id)

    if month:
        query = query.filter(extract('month', Expense.date) == month)
    if year:
        query = query.filter(extract('year', Expense.date) == year)
    if category:
        query = query.filter(Expense.category == category)
    if search:
        term = f"%{search}%"
        query = query.filter(or_(Expense.description.ilike(term), Expense.category.ilike(term)))

    # Sorting
    sort_column = Expense.amount if sort_by == "amount" else Expense.date
    if order == "asc":
        query = query.order_by(asc(sort_column), asc(Expense.created_at))
    else:
        query = query.order_by(desc(sort_column), desc(Expense.created_at))

    expenses = query.all()
    total = sum(e.amount for e in expenses)

    return jsonify({
        "total_amount": round(total, 2),
        "count": len(expenses),
        "expenses": [e.to_dict() for e in expenses]
    }), 200


@expense_bp.route("", methods=["POST"])
@token_required
def create_expense(current_user):
    data = request.get_json() or {}
    amount = data.get("amount")
    category = data.get("category", "").strip()
    description = data.get("description", "").strip()
    date_str = data.get("date")
    payment_method = data.get("payment_method", "UPI").strip()

    # Validation
    try:
        amount = float(amount)
        if amount <= 0:
            return jsonify({"error": "Validation Error", "message": "Expense amount must be greater than 0."}), 400
    except (TypeError, ValueError):
        return jsonify({"error": "Validation Error", "message": "Please enter a valid numeric expense amount."}), 400

    if not category:
        return jsonify({"error": "Validation Error", "message": "Category is required."}), 400

    expense_date = date.today()
    if date_str:
        try:
            expense_date = datetime.strptime(date_str, "%Y-%m-%d").date()
        except ValueError:
            return jsonify({"error": "Validation Error", "message": "Invalid date format. Use YYYY-MM-DD."}), 400

    expense = Expense(
        user_id=current_user.id,
        amount=amount,
        category=category,
        description=description,
        date=expense_date,
        payment_method=payment_method
    )
    db.session.add(expense)
    db.session.commit()

    return jsonify({
        "message": "Expense recorded successfully.",
        "expense": expense.to_dict()
    }), 201


@expense_bp.route("/<int:expense_id>", methods=["PUT"])
@token_required
def update_expense(current_user, expense_id):
    expense = Expense.query.filter_by(id=expense_id, user_id=current_user.id).first()
    if not expense:
        return jsonify({"error": "Not Found", "message": "Expense record not found."}), 404

    data = request.get_json() or {}
    if "amount" in data:
        try:
            amount = float(data["amount"])
            if amount <= 0:
                return jsonify({"error": "Validation Error", "message": "Expense amount must be greater than 0."}), 400
            expense.amount = amount
        except (TypeError, ValueError):
            return jsonify({"error": "Validation Error", "message": "Invalid numeric amount."}), 400

    if "category" in data and data["category"].strip():
        expense.category = data["category"].strip()

    if "description" in data:
        expense.description = data["description"].strip()

    if "date" in data and data["date"]:
        try:
            expense.date = datetime.strptime(data["date"], "%Y-%m-%d").date()
        except ValueError:
            return jsonify({"error": "Validation Error", "message": "Invalid date format. Use YYYY-MM-DD."}), 400

    if "payment_method" in data:
        expense.payment_method = data["payment_method"].strip()

    db.session.commit()
    return jsonify({
        "message": "Expense updated successfully.",
        "expense": expense.to_dict()
    }), 200


@expense_bp.route("/<int:expense_id>", methods=["DELETE"])
@token_required
def delete_expense(current_user, expense_id):
    expense = Expense.query.filter_by(id=expense_id, user_id=current_user.id).first()
    if not expense:
        return jsonify({"error": "Not Found", "message": "Expense record not found."}), 404

    db.session.delete(expense)
    db.session.commit()
    return jsonify({"message": "Expense record deleted successfully."}), 200


@expense_bp.route("/categories", methods=["GET"])
@token_required
def get_categories(current_user):
    user_cats = db.session.query(Expense.category).filter_by(user_id=current_user.id).distinct().all()
    user_cat_list = [c[0] for c in user_cats if c[0]]
    combined = sorted(list(set(DEFAULT_CATEGORIES + user_cat_list)))
    return jsonify({
        "categories": combined,
        "payment_methods": PAYMENT_METHODS
    }), 200
