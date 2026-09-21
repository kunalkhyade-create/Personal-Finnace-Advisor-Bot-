from datetime import datetime, date
from sqlalchemy import func, extract
from backend.app import db
from backend.app.models.models import Income, Expense, Budget, FinancialGoal

class FinanceService:
    @staticmethod
    def get_monthly_totals(user_id, month, year):
        """
        Calculates total income, total expenses, savings, and savings rate for a given month and year.
        Handles zero-income safely without divide-by-zero errors.
        """
        # Income total
        income_query = db.session.query(func.coalesce(func.sum(Income.amount), 0.0)).filter(
            Income.user_id == user_id,
            extract('month', Income.date) == month,
            extract('year', Income.date) == year
        ).scalar()
        total_income = round(float(income_query or 0.0), 2)

        # Expense total
        expense_query = db.session.query(func.coalesce(func.sum(Expense.amount), 0.0)).filter(
            Expense.user_id == user_id,
            extract('month', Expense.date) == month,
            extract('year', Expense.date) == year
        ).scalar()
        total_expense = round(float(expense_query or 0.0), 2)

        # Savings = Total Income - Total Expenses
        savings = round(total_income - total_expense, 2)

        # Savings Rate = (Savings / Total Income) * 100
        if total_income > 0:
            savings_rate = round((savings / total_income) * 100, 1)
        else:
            savings_rate = 0.0

        return {
            "month": month,
            "year": year,
            "total_income": total_income,
            "total_expenses": total_expense,
            "total_savings": savings,
            "savings_rate": savings_rate
        }

    @staticmethod
    def get_category_breakdown(user_id, month, year):
        """
        Returns expense aggregation by category for a specific month and year,
        including amount and percentage of total expenses.
        """
        results = db.session.query(
            Expense.category,
            func.sum(Expense.amount).label("total"),
            func.count(Expense.id).label("count")
        ).filter(
            Expense.user_id == user_id,
            extract('month', Expense.date) == month,
            extract('year', Expense.date) == year
        ).group_by(Expense.category).order_by(func.sum(Expense.amount).desc()).all()

        total_expense = sum(float(r.total) for r in results) or 0.0

        breakdown = []
        for r in results:
            cat_amount = round(float(r.total), 2)
            pct = round((cat_amount / total_expense * 100), 1) if total_expense > 0 else 0.0
            breakdown.append({
                "category": r.category,
                "amount": cat_amount,
                "count": r.count,
                "percentage": pct
            })

        return {
            "total_expense": round(total_expense, 2),
            "breakdown": breakdown
        }

    @staticmethod
    def get_budget_status(user_id, month, year):
        """
        Computes budget limits vs actual spent per category, remaining amount,
        percentage used, and overspent amounts.
        """
        budgets = Budget.query.filter_by(user_id=user_id, month=month, year=year).all()

        # Category spending
        expenses = db.session.query(
            Expense.category,
            func.sum(Expense.amount).label("spent")
        ).filter(
            Expense.user_id == user_id,
            extract('month', Expense.date) == month,
            extract('year', Expense.date) == year
        ).group_by(Expense.category).all()

        spent_map = {e.category: float(e.spent) for e in expenses}

        budget_status_list = []
        total_budget = 0.0
        total_spent_on_budgeted = 0.0
        exceeded_count = 0

        for b in budgets:
            limit = round(float(b.monthly_limit), 2)
            spent = round(spent_map.get(b.category, 0.0), 2)
            remaining = round(limit - spent, 2)
            pct_used = round((spent / limit * 100), 1) if limit > 0 else 0.0
            is_exceeded = spent > limit
            exceeded_by = round(spent - limit, 2) if is_exceeded else 0.0

            total_budget += limit
            total_spent_on_budgeted += spent
            if is_exceeded:
                exceeded_count += 1

            budget_status_list.append({
                "id": b.id,
                "category": b.category,
                "monthly_limit": limit,
                "spent": spent,
                "remaining": remaining,
                "percentage_used": pct_used,
                "is_exceeded": is_exceeded,
                "exceeded_by": exceeded_by
            })

        # Also find expenses that have no budget set
        budgeted_categories = {b.category for b in budgets}
        unbudgeted = []
        for cat, spent_amt in spent_map.items():
            if cat not in budgeted_categories:
                unbudgeted.append({
                    "category": cat,
                    "spent": round(spent_amt, 2)
                })

        return {
            "month": month,
            "year": year,
            "total_budget": round(total_budget, 2),
            "total_spent_on_budgeted": round(total_spent_on_budgeted, 2),
            "exceeded_count": exceeded_count,
            "budgets": budget_status_list,
            "unbudgeted_expenses": unbudgeted
        }

    @staticmethod
    def get_monthly_comparison(user_id, current_month, current_year):
        """
        Compares current month totals with the previous month.
        """
        prev_month = 12 if current_month == 1 else current_month - 1
        prev_year = current_year - 1 if current_month == 1 else current_year

        curr_totals = FinanceService.get_monthly_totals(user_id, current_month, current_year)
        prev_totals = FinanceService.get_monthly_totals(user_id, prev_month, prev_year)

        income_diff = round(curr_totals["total_income"] - prev_totals["total_income"], 2)
        income_pct_change = round((income_diff / prev_totals["total_income"] * 100), 1) if prev_totals["total_income"] > 0 else 0.0

        expense_diff = round(curr_totals["total_expenses"] - prev_totals["total_expenses"], 2)
        expense_pct_change = round((expense_diff / prev_totals["total_expenses"] * 100), 1) if prev_totals["total_expenses"] > 0 else 0.0

        savings_diff = round(curr_totals["total_savings"] - prev_totals["total_savings"], 2)

        # Category comparison
        curr_breakdown = {b["category"]: b["amount"] for b in FinanceService.get_category_breakdown(user_id, current_month, current_year)["breakdown"]}
        prev_breakdown = {b["category"]: b["amount"] for b in FinanceService.get_category_breakdown(user_id, prev_month, prev_year)["breakdown"]}

        all_cats = set(curr_breakdown.keys()).union(set(prev_breakdown.keys()))
        category_comparison = []
        for cat in sorted(all_cats):
            curr_amt = curr_breakdown.get(cat, 0.0)
            prev_amt = prev_breakdown.get(cat, 0.0)
            diff = round(curr_amt - prev_amt, 2)
            category_comparison.append({
                "category": cat,
                "current_month_amount": curr_amt,
                "previous_month_amount": prev_amt,
                "difference": diff,
                "status": "increased" if diff > 0 else "decreased" if diff < 0 else "unchanged"
            })

        return {
            "current": curr_totals,
            "previous": prev_totals,
            "income_change": income_diff,
            "income_pct_change": income_pct_change,
            "expense_change": expense_diff,
            "expense_pct_change": expense_pct_change,
            "savings_change": savings_diff,
            "category_comparison": category_comparison
        }

    @staticmethod
    def calculate_financial_health(user_id, month, year):
        """
        Calculates a transparent Financial Health Score (0-100) based on clear rules:
        - Savings Rate (Max 35 points)
        - Budget Adherence (Max 30 points)
        - Goal & Emergency Fund status (Max 20 points)
        - Month-over-Month Expense Control (Max 15 points)
        """
        totals = FinanceService.get_monthly_totals(user_id, month, year)
        budget_info = FinanceService.get_budget_status(user_id, month, year)
        comparison = FinanceService.get_monthly_comparison(user_id, month, year)
        goals = FinancialGoal.query.filter_by(user_id=user_id).all()

        score = 0
        breakdown = {}

        # 1. Savings Rate Score (0 - 35 points)
        # >25% = 35, 20-25% = 30, 15-20% = 25, 10-15% = 18, 5-10% = 10, >0% = 5, <=0 = 0
        sr = totals["savings_rate"]
        if sr >= 25:
            sr_score = 35
        elif sr >= 20:
            sr_score = 30
        elif sr >= 15:
            sr_score = 25
        elif sr >= 10:
            sr_score = 18
        elif sr > 0:
            sr_score = 10
        else:
            sr_score = 0
        score += sr_score
        breakdown["savings_rate"] = {
            "score": sr_score,
            "max": 35,
            "description": f"Savings rate of {sr}% earned {sr_score}/35 points."
        }

        # 2. Budget Adherence Score (0 - 30 points)
        # Based on how many budgets were kept vs exceeded
        total_budgets = len(budget_info["budgets"])
        if total_budgets == 0:
            budget_score = 18 # Neutral baseline if no budgets configured yet
        else:
            exceeded = budget_info["exceeded_count"]
            adherence_ratio = (total_budgets - exceeded) / total_budgets
            budget_score = round(adherence_ratio * 30)
        score += budget_score
        breakdown["budget_adherence"] = {
            "score": budget_score,
            "max": 30,
            "description": f"{budget_info['exceeded_count']} budgets exceeded out of {total_budgets} configured."
        }

        # 3. Goals & Emergency Fund (0 - 20 points)
        goal_score = 0
        has_emergency_fund = any("emergency" in g.goal_name.lower() for g in goals)
        if goals:
            avg_progress = sum(g.to_dict()["progress_percentage"] for g in goals) / len(goals)
            goal_score += min(12, int(avg_progress * 0.12))
        if has_emergency_fund:
            goal_score += 8
        goal_score = min(20, goal_score)
        score += goal_score
        breakdown["goals"] = {
            "score": goal_score,
            "max": 20,
            "description": f"{len(goals)} active goals. Emergency fund tracked: {'Yes' if has_emergency_fund else 'No'}."
        }

        # 4. Expense Control vs Previous Month (0 - 15 points)
        expense_growth = comparison["expense_pct_change"]
        if expense_growth <= -5:
            control_score = 15 # Reduced spending
        elif expense_growth <= 5:
            control_score = 13 # Stable spending (+/- 5%)
        elif expense_growth <= 15:
            control_score = 9  # Moderate increase
        else:
            control_score = 3  # Steep expense spike
        score += control_score
        breakdown["expense_control"] = {
            "score": control_score,
            "max": 15,
            "description": f"Month-over-month expense change of {expense_growth:+.1f}%."
        }

        final_score = min(100, max(0, score))
        if final_score >= 80:
            rating = "Excellent"
            status_color = "emerald"
            summary = "Outstanding financial management. Your savings discipline and spending controls are strong."
        elif final_score >= 65:
            rating = "Good"
            status_color = "blue"
            summary = "Solid financial health with healthy savings. Minor budget optimizations can push you higher."
        elif final_score >= 50:
            rating = "Fair"
            status_color = "amber"
            summary = "Moderate financial balance. Focus on curbing overspending in top expense categories."
        else:
            rating = "Needs Attention"
            status_color = "rose"
            summary = "Immediate attention recommended. Expenses are outpacing budget limits and savings are low."

        return {
            "score": final_score,
            "rating": rating,
            "status_color": status_color,
            "summary": summary,
            "breakdown": breakdown
        }

    @staticmethod
    def get_recent_transactions(user_id, limit=10):
        """
        Retrieves combined latest incomes and expenses sorted by date descending.
        """
        incomes = Income.query.filter_by(user_id=user_id).order_by(Income.date.desc(), Income.created_at.desc()).limit(limit).all()
        expenses = Expense.query.filter_by(user_id=user_id).order_by(Expense.date.desc(), Expense.created_at.desc()).limit(limit).all()

        combined = []
        for inc in incomes:
            combined.append({
                "id": inc.id,
                "type": "income",
                "title": inc.source,
                "subtitle": inc.description or inc.income_type,
                "amount": inc.amount,
                "date": inc.date.isoformat() if inc.date else "",
                "created_at": inc.created_at.isoformat()
            })
        for exp in expenses:
            combined.append({
                "id": exp.id,
                "type": "expense",
                "title": exp.category,
                "subtitle": exp.description or exp.payment_method,
                "amount": exp.amount,
                "date": exp.date.isoformat() if exp.date else "",
                "created_at": exp.created_at.isoformat()
            })

        combined.sort(key=lambda x: (x["date"], x["created_at"]), reverse=True)
        return combined[:limit]

    @staticmethod
    def get_monthly_trend(user_id, months_count=6):
        """
        Computes 6-month historical trend of income, expenses, and savings.
        """
        today = date.today()
        trend = []

        # Iterate backward for `months_count` months
        for i in range(months_count - 1, -1, -1):
            m = today.month - i
            y = today.year
            while m <= 0:
                m += 12
                y -= 1

            totals = FinanceService.get_monthly_totals(user_id, m, y)
            month_name = date(y, m, 1).strftime("%b %Y")
            trend.append({
                "month_name": month_name,
                "month": m,
                "year": y,
                "income": totals["total_income"],
                "expenses": totals["total_expenses"],
                "savings": totals["total_savings"],
                "savings_rate": totals["savings_rate"]
            })

        return trend
