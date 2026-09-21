import json
from datetime import date
from flask import Blueprint, request, jsonify
from backend.app import db
from backend.app.models.models import FinancialReport, FinancialGoal
from backend.app.services.finance_service import FinanceService
from backend.app.services.ai_service import AIService
from backend.app.utils.auth_helper import token_required

report_bp = Blueprint("reports", __name__)

@report_bp.route("/monthly", methods=["GET"])
@token_required
def get_monthly_report(current_user):
    today = date.today()
    month = request.args.get("month", default=today.month, type=int)
    year = request.args.get("year", default=today.year, type=int)

    # Gather all components
    totals = FinanceService.get_monthly_totals(current_user.id, month, year)
    category_data = FinanceService.get_category_breakdown(current_user.id, month, year)
    budget_status = FinanceService.get_budget_status(current_user.id, month, year)
    comparison = FinanceService.get_monthly_comparison(current_user.id, month, year)
    health = FinanceService.calculate_financial_health(current_user.id, month, year)
    ai_analysis = AIService.generate_rule_based_analysis(current_user, month=month, year=year)
    goals = FinancialGoal.query.filter_by(user_id=current_user.id).all()

    month_name = date(year, month, 1).strftime("%B %Y")

    report_payload = {
        "month": month,
        "year": year,
        "month_name": month_name,
        "user": current_user.to_dict(),
        "summary": totals,
        "health": health,
        "categories": category_data["breakdown"],
        "budgets": budget_status["budgets"],
        "comparison": comparison,
        "goals": [g.to_dict() for g in goals],
        "ai_insights": {
            "alerts": ai_analysis["alerts"],
            "observations": ai_analysis["observations"],
            "recommendations": ai_analysis["recommendations"],
            "disclaimer": ai_analysis["disclaimer"]
        },
        "generated_at": date.today().isoformat()
    }

    # Cache/Save snapshot in database
    existing_report = FinancialReport.query.filter_by(user_id=current_user.id, month=month, year=year).first()
    if existing_report:
        existing_report.summary_json = json.dumps(report_payload)
    else:
        new_report = FinancialReport(
            user_id=current_user.id,
            month=month,
            year=year,
            summary_json=json.dumps(report_payload)
        )
        db.session.add(new_report)
    db.session.commit()

    return jsonify(report_payload), 200


@report_bp.route("/<int:year>/<int:month>", methods=["GET"])
@token_required
def get_report_by_params(current_user, year, month):
    return get_monthly_report(current_user)
