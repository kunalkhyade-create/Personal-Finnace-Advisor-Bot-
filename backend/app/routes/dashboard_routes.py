from datetime import date
from flask import Blueprint, request, jsonify
from backend.app.services.finance_service import FinanceService
from backend.app.services.ai_service import AIService
from backend.app.models.models import FinancialGoal
from backend.app.utils.auth_helper import token_required

dashboard_bp = Blueprint("dashboard", __name__)

@dashboard_bp.route("/summary", methods=["GET"])
@token_required
def get_summary(current_user):
    today = date.today()
    month = request.args.get("month", default=today.month, type=int)
    year = request.args.get("year", default=today.year, type=int)

    totals = FinanceService.get_monthly_totals(current_user.id, month, year)
    comparison = FinanceService.get_monthly_comparison(current_user.id, month, year)
    health = FinanceService.calculate_financial_health(current_user.id, month, year)
    budget_status = FinanceService.get_budget_status(current_user.id, month, year)

    # Dynamic dashboard alerts
    alerts = []
    # Budget alerts
    for b in budget_status["budgets"]:
        if b["is_exceeded"]:
            alerts.append({
                "type": "danger",
                "icon": "alert-triangle",
                "message": f"⚠️ {b['category']} budget exceeded by ₹{b['exceeded_by']:,.0f} ({b['percentage_used']}% used)."
            })
        elif b["percentage_used"] >= 80:
            alerts.append({
                "type": "warning",
                "icon": "alert-circle",
                "message": f"⚡ {b['category']} spending is at {b['percentage_used']}% of your monthly limit."
            })

    # Savings trend alert
    if comparison["savings_change"] > 0:
        alerts.append({
            "type": "success",
            "icon": "trending-up",
            "message": f"💡 Your net savings increased by ₹{comparison['savings_change']:,.0f} compared with last month."
        })
    elif comparison["expense_pct_change"] > 15:
        alerts.append({
            "type": "warning",
            "icon": "trending-down",
            "message": f"📊 Your expenses increased by {comparison['expense_pct_change']}% compared with last month."
        })

    # Goal alert
    goals = FinancialGoal.query.filter_by(user_id=current_user.id).all()
    for g in goals:
        p = g.to_dict()["progress_percentage"]
        if p >= 50 and p < 100:
            alerts.append({
                "type": "info",
                "icon": "target",
                "message": f"🎯 You are {p}% closer to your '{g.goal_name}' goal!"
            })
            break

    return jsonify({
        "totals": totals,
        "comparison": comparison,
        "health": health,
        "alerts": alerts,
        "user": current_user.to_dict()
    }), 200


@dashboard_bp.route("/category-breakdown", methods=["GET"])
@token_required
def get_category_breakdown(current_user):
    today = date.today()
    month = request.args.get("month", default=today.month, type=int)
    year = request.args.get("year", default=today.year, type=int)

    breakdown = FinanceService.get_category_breakdown(current_user.id, month, year)
    return jsonify(breakdown), 200


@dashboard_bp.route("/monthly-trend", methods=["GET"])
@token_required
def get_monthly_trend(current_user):
    months_count = request.args.get("months", default=6, type=int)
    trend = FinanceService.get_monthly_trend(current_user.id, months_count)
    return jsonify({"trend": trend}), 200


@dashboard_bp.route("/recent", methods=["GET"])
@token_required
def get_recent(current_user):
    limit = request.args.get("limit", default=8, type=int)
    transactions = FinanceService.get_recent_transactions(current_user.id, limit)
    return jsonify({"transactions": transactions}), 200
