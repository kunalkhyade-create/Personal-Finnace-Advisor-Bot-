import json
import os
import requests
from datetime import date
from sqlalchemy import func
from backend.app.services.finance_service import FinanceService
from backend.app.models.models import FinancialGoal, Budget, Expense, Income, AIConversation
from backend.app import db

DISCLAIMER = "AI-generated suggestions are for educational and planning purposes only and should not be considered professional financial advice."

class AIService:
    @staticmethod
    def generate_rule_based_analysis(user, month=None, year=None):
        """
        Comprehensive rule-based financial advisor engine.
        Works 100% reliably with zero external API dependencies.
        """
        today = date.today()
        month = month or today.month
        year = year or today.year

        totals = FinanceService.get_monthly_totals(user.id, month, year)
        budget_info = FinanceService.get_budget_status(user.id, month, year)
        comparison = FinanceService.get_monthly_comparison(user.id, month, year)
        category_data = FinanceService.get_category_breakdown(user.id, month, year)
        health = FinanceService.calculate_financial_health(user.id, month, year)
        goals = FinancialGoal.query.filter_by(user_id=user.id).all()

        income = totals["total_income"]
        expenses = totals["total_expenses"]
        savings = totals["total_savings"]
        savings_rate = totals["savings_rate"]

        alerts = []
        recommendations = []
        observations = []
        overspending_alerts = []

        # 1. Overspending detection against category budgets
        for b in budget_info["budgets"]:
            if b["is_exceeded"]:
                alert_text = f"Budget exceeded for {b['category']} by ₹{b['exceeded_by']:,.0f} (Spent ₹{b['spent']:,.0f} against limit ₹{b['monthly_limit']:,.0f})."
                overspending_alerts.append({
                    "category": b["category"],
                    "spent": b["spent"],
                    "limit": b["monthly_limit"],
                    "exceeded_by": b["exceeded_by"],
                    "message": alert_text
                })
                alerts.append({"type": "danger", "title": f"Over budget: {b['category']}", "message": alert_text})

        # 2. Discretionary spending > 30% of total income rule
        if income > 0:
            for cat in category_data["breakdown"]:
                cat_name = cat["category"].lower()
                cat_pct_of_income = round((cat["amount"] / income) * 100, 1)
                
                # Flag high discretionary categories
                if cat_name in ["food", "entertainment", "shopping", "travel", "personal"] and cat_pct_of_income > 30:
                    msg = f"You spent {cat_pct_of_income}% of your income on {cat['category']} this month (₹{cat['amount']:,.0f}). Consider setting a stricter budget next month to safeguard savings."
                    alerts.append({"type": "warning", "title": f"High {cat['category']} spending", "message": msg})
                elif cat_name in ["rent", "emi/loans", "bills"] and cat_pct_of_income > 40:
                    msg = f"Fixed obligations for {cat['category']} consume {cat_pct_of_income}% of your monthly income. Keeping fixed costs under 50% helps cushion financial emergencies."
                    observations.append(msg)

        # 3. Savings Rate Rules
        if income == 0 and expenses > 0:
            alerts.append({"type": "warning", "title": "Zero Income Recorded", "message": "You recorded expenses of ₹{:,.0f} without any logged income for this month. Ensure all earnings are updated.".format(expenses)})
        elif savings_rate < 10:
            alerts.append({"type": "warning", "title": "Low Savings Rate", "message": f"Your current savings rate is {savings_rate}%. Financial experts typically suggest striving for at least 20%."})
            recommendations.append("Prioritize trimming top discretionary expenses such as dining out, shopping, and subscription bills.")
        elif 10 <= savings_rate <= 20:
            observations.append(f"Your savings rate is healthy at {savings_rate}%. You are maintaining good financial traction.")
            recommendations.append("Automate a portion of your savings at the start of the month to gradually push your savings rate above 20%.")
        elif savings_rate > 20:
            observations.append(f"Outstanding discipline! Your savings rate is {savings_rate}%, well above the typical 20% baseline.")
            recommendations.append("Consider deploying surplus savings into targeted goals like an Emergency Fund or long-term growth instruments.")

        # 4. Expense Velocity / Month-over-Month Spike Rule
        if comparison["previous"]["total_expenses"] > 0:
            exp_change_pct = comparison["expense_pct_change"]
            if exp_change_pct > 15:
                alerts.append({
                    "type": "warning",
                    "title": "Expense Spike Alert",
                    "message": f"Your total expenses increased by {exp_change_pct}% (+₹{comparison['expense_change']:,.0f}) compared to last month."
                })
            elif exp_change_pct < -10:
                observations.append(f"Great job! You cut your total monthly expenses by {abs(exp_change_pct)}% compared to last month.")

        # 5. Income Change Rule
        if comparison["previous"]["total_income"] > 0:
            inc_change = comparison["income_change"]
            if inc_change < -500:
                alerts.append({
                    "type": "info",
                    "title": "Income Variation",
                    "message": f"Your monthly income dropped by ₹{abs(inc_change):,.0f} compared to last month. Pruning non-essential commitments will keep you balanced."
                })

        # 6. Emergency Fund & Goal Rules
        has_emergency_fund = False
        for g in goals:
            if "emergency" in g.goal_name.lower():
                has_emergency_fund = True
                pct = g.to_dict()["progress_percentage"]
                if pct < 100:
                    target_months = 3
                    rec_emergency = expenses * target_months if expenses > 0 else 50000
                    observations.append(f"Emergency Fund progress: {pct}%. Recommended target is 3–6 months of living expenses (~₹{rec_emergency:,.0f}).")
                else:
                    observations.append("Congratulations! Your Emergency Fund target is fully funded.")
                break

        if not has_emergency_fund:
            recommendations.append("Create a dedicated 'Emergency Fund' goal covering 3–6 months of essential living expenses (rent, food, bills).")

        # 7. Persona specific insights
        persona = getattr(user, "persona", "Salaried")
        if persona == "College Student":
            recommendations.append("As a student, look into student discounts on transit and software, and split housing/grocery expenses with roommates.")
        elif persona == "Freelancer":
            recommendations.append("Because freelance cash flow fluctuates, maintain a 6-month buffer and set aside 15-20% of every invoice for taxes.")
        elif persona == "Household Manager":
            recommendations.append("Consolidate recurring family grocery runs and review annual utility contracts for bulk savings.")

        return {
            "month": month,
            "year": year,
            "persona": persona,
            "totals": totals,
            "health": health,
            "alerts": alerts,
            "overspending_alerts": overspending_alerts,
            "observations": observations,
            "recommendations": recommendations,
            "disclaimer": DISCLAIMER,
            "is_ai_powered": False
        }

    @staticmethod
    def generate_personalized_budget(user_id, monthly_income=None):
        """
        Generates smart category budget recommendations based on the 50/30/20 framework
        dynamically refined by the user's actual historical spending.
        """
        today = date.today()
        totals = FinanceService.get_monthly_totals(user_id, today.month, today.year)
        
        income = monthly_income or totals["total_income"]
        if income <= 0:
            # Fallback to previous month or default baseline
            prev_totals = FinanceService.get_monthly_comparison(user_id, today.month, today.year)["previous"]
            income = prev_totals["total_income"] or 40000.0

        # Needs categories: Rent, Food, Utilities, Education, Healthcare, Bills, Groceries, EMI/Loans
        # Wants categories: Entertainment, Shopping, Travel, Personal, Other
        # Savings: 20%
        needs_target = round(income * 0.50, 2)
        wants_target = round(income * 0.30, 2)
        savings_target = round(income * 0.20, 2)

        # Get historical average by category for this user
        cat_history = db.session.query(
            Expense.category,
            func.avg(Expense.amount).label("avg_spent")
        ).filter(Expense.user_id == user_id).group_by(Expense.category).all()

        historical_map = {c.category: float(c.avg_spent) for c in cat_history}

        # Categories list with classification
        default_allocations = [
            {"category": "Food", "type": "needs", "default_pct": 0.14, "suggestion": "Essential groceries and dining budget."},
            {"category": "Rent", "type": "needs", "default_pct": 0.22, "suggestion": "Housing and rental accommodation limit."},
            {"category": "Utilities", "type": "needs", "default_pct": 0.05, "suggestion": "Electricity, water, gas, and internet."},
            {"category": "Transport", "type": "needs", "default_pct": 0.05, "suggestion": "Fuel, public transit, and commute."},
            {"category": "Bills", "type": "needs", "default_pct": 0.04, "suggestion": "Mobile recharges, subscriptions, and regular fees."},
            {"category": "Healthcare", "type": "needs", "default_pct": 0.04, "suggestion": "Medications, checkups, and wellness buffer."},
            {"category": "Entertainment", "type": "wants", "default_pct": 0.08, "suggestion": "Movies, streaming, dining out, and events."},
            {"category": "Shopping", "type": "wants", "default_pct": 0.08, "suggestion": "Clothing, electronics, and personal purchases."},
            {"category": "Travel", "type": "wants", "default_pct": 0.05, "suggestion": "Weekend trips and vacation savings."},
            {"category": "Personal", "type": "wants", "default_pct": 0.05, "suggestion": "Self-care, hobbies, and personal miscellaneous."}
        ]

        # Calculate recommended budgets
        budget_plan = []
        total_recommended = 0.0

        for item in default_allocations:
            cat = item["category"]
            hist_spent = round(historical_map.get(cat, 0.0), 2)
            base_budget = round(income * item["default_pct"], 2)

            # If user has history, blend base guideline with their historical reality
            if hist_spent > 0:
                # 60% historical anchor, 40% optimal allocation to guide reduction
                recommended_budget = round((hist_spent * 0.6) + (base_budget * 0.4), 0)
            else:
                recommended_budget = round(base_budget, 0)

            diff = round(recommended_budget - hist_spent, 2)
            total_recommended += recommended_budget

            budget_plan.append({
                "category": cat,
                "type": item["type"],
                "current_spending": hist_spent,
                "recommended_budget": recommended_budget,
                "difference": diff,
                "suggestion": item["suggestion"]
            })

        return {
            "monthly_income": income,
            "needs_target": needs_target,
            "wants_target": wants_target,
            "savings_target": savings_target,
            "total_recommended_budget": round(total_recommended, 2),
            "projected_savings": round(max(0.0, income - total_recommended), 2),
            "projected_savings_rate": round(max(0.0, (income - total_recommended) / income * 100), 1) if income > 0 else 0.0,
            "budgets": budget_plan,
            "disclaimer": DISCLAIMER
        }

    @staticmethod
    def answer_chat(user, user_message):
        """
        Interactive AI financial chatbot.
        Always contextualized with the user's real financial records from the database.
        Falls back to intelligent deterministic financial parsing if no API key is available.
        """
        today = date.today()
        totals = FinanceService.get_monthly_totals(user.id, today.month, today.year)
        category_data = FinanceService.get_category_breakdown(user.id, today.month, today.year)
        budget_info = FinanceService.get_budget_status(user.id, today.month, today.year)
        comparison = FinanceService.get_monthly_comparison(user.id, today.month, today.year)
        goals = FinancialGoal.query.filter_by(user_id=user.id).all()

        # Build context snapshot
        income = totals["total_income"]
        expenses = totals["total_expenses"]
        savings = totals["total_savings"]
        savings_rate = totals["savings_rate"]

        top_categories = category_data["breakdown"][:3]
        top_cat_desc = ", ".join([f"{c['category']} (₹{c['amount']:,.0f}, {c['percentage']}%)" for c in top_categories]) if top_categories else "None recorded"
        
        exceeded_budgets = [f"{b['category']} (Exceeded by ₹{b['exceeded_by']:,.0f})" for b in budget_info["budgets"] if b["is_exceeded"]]
        goals_desc = ", ".join([f"{g.goal_name}: {g.to_dict()['progress_percentage']}%" for g in goals]) if goals else "No active goals"

        # Check for external API key
        api_key = os.getenv("AI_API_KEY", "")
        if api_key and len(api_key.strip()) > 10:
            try:
                # External LLM query (e.g. Gemini REST API or OpenAI-compatible)
                response = AIService._query_external_llm(
                    api_key=api_key,
                    user_message=user_message,
                    context={
                        "user_name": user.name,
                        "persona": user.persona,
                        "income": income,
                        "expenses": expenses,
                        "savings": savings,
                        "savings_rate": savings_rate,
                        "top_categories": top_cat_desc,
                        "exceeded_budgets": exceeded_budgets,
                        "goals": goals_desc,
                        "comparison": comparison
                    }
                )
                if response:
                    return {
                        "reply": response,
                        "is_ai_powered": True,
                        "disclaimer": DISCLAIMER
                    }
            except Exception as e:
                # Log and proceed to fallback
                pass

        # Intelligent Rule-Based Chatbot Fallback
        reply = AIService._rule_based_chat_reply(
            user=user,
            user_message=user_message,
            income=income,
            expenses=expenses,
            savings=savings,
            savings_rate=savings_rate,
            top_categories=top_categories,
            exceeded_budgets=exceeded_budgets,
            goals=goals,
            comparison=comparison
        )

        return {
            "reply": reply,
            "is_ai_powered": False,
            "disclaimer": DISCLAIMER
        }

    @staticmethod
    def _rule_based_chat_reply(user, user_message, income, expenses, savings, savings_rate, top_categories, exceeded_budgets, goals, comparison):
        msg = user_message.lower().strip()

        # 1. Savings inquiries
        if "save" in msg or "savings" in msg or "how can i save" in msg:
            if income == 0:
                return f"You currently have no recorded income for this month. Once you log your monthly income, I will calculate your exact savings capacity!"
            if savings_rate >= 25:
                return (f"Your savings are currently strong! You have saved ₹{savings:,.0f} this month with a savings rate of {savings_rate}%. "
                        f"To build further, consider directing ₹{round(savings * 0.3):,.0f} into targeted goals like an Emergency Fund or long-term investments.")
            elif savings_rate > 0:
                top_cat = top_categories[0]["category"] if top_categories else "top categories"
                return (f"Your current savings rate is {savings_rate}% (₹{savings:,.0f} saved out of ₹{income:,.0f} income). "
                        f"Based on your transactions, your largest expense is {top_cat}. Trimming 10-15% from discretionary spending could boost your monthly savings by ₹{round(expenses * 0.1):,.0f}.")
            else:
                return (f"Right now your expenses (₹{expenses:,.0f}) exceed or match your income (₹{income:,.0f}). "
                        f"I recommend immediately reviewing your top spending categories ({', '.join([c['category'] for c in top_categories])}) to eliminate unessential purchases.")

        # 2. Overspending or "where am I spending too much"
        if "too much" in msg or "overspend" in msg or "spend" in msg or "spending" in msg or "expenses" in msg:
            if not top_categories:
                return "You haven't recorded any expenses for this month yet. Add your daily expenses to see a categorized spending analysis!"
            
            top_str = "\n".join([f"• {c['category']}: ₹{c['amount']:,.0f} ({c['percentage']}% of total expenses)" for c in top_categories])
            over_str = f"\n⚠️ You have also exceeded budgets in: {', '.join(exceeded_budgets)}." if exceeded_budgets else ""
            
            return (f"Based on your actual data this month, your top expense categories are:\n{top_str}{over_str}\n\n"
                    f"Consider setting a firm monthly ceiling on your top category ({top_categories[0]['category']}) using the Budgets tab.")

        # 3. Create a budget / Next month budget
        if "budget" in msg or "create a budget" in msg or "plan" in msg:
            rec_needs = round(income * 0.50, 0)
            rec_wants = round(income * 0.30, 0)
            rec_savings = round(income * 0.20, 0)
            return (f"Based on your recorded income of ₹{income:,.0f}, here is a recommended 50/30/20 allocation for next month:\n"
                    f"• Essential Needs (50%): ₹{rec_needs:,.0f} (Rent, Groceries, Utilities, Bills)\n"
                    f"• Discretionary Wants (30%): ₹{rec_wants:,.0f} (Entertainment, Dining, Shopping)\n"
                    f"• Savings & Goals (20%): ₹{rec_savings:,.0f}\n\n"
                    f"You can use our 'Personalized Budget Generator' in the Budgets or AI Advisor page to apply these limits automatically!")

        # 4. Food expenses
        if "food" in msg or "groceries" in msg or "dining" in msg:
            food_item = next((c for c in top_categories if c["category"].lower() in ["food", "groceries"]), None)
            if food_item:
                return (f"You have spent ₹{food_item['amount']:,.0f} on {food_item['category']} this month, which represents {food_item['percentage']}% of your total expenses. "
                        f"Tips to reduce food spending:\n1. Meal plan weekly to prevent grocery waste.\n2. Limit food deliveries to once a week.\n3. Buy staples in bulk.")
            return "You haven't recorded any expenses under Food or Groceries this month. If you incurred food costs, record them in the Expenses tab."

        # 5. Why are my expenses increasing / Comparison
        if "increasing" in msg or "increase" in msg or "trend" in msg or "compare" in msg or "last month" in msg:
            diff = comparison["expense_change"]
            pct = comparison["expense_pct_change"]
            if diff > 0:
                top_increases = [c for c in comparison["category_comparison"] if c["difference"] > 0]
                top_inc_str = ", ".join([f"{c['category']} (+₹{c['difference']:,.0f})" for c in top_increases[:2]]) or "general spending"
                return (f"Your expenses increased by ₹{diff:,.0f} ({pct}%) compared to last month. "
                        f"The main categories driving this increase are: {top_inc_str}. Reviewing these areas will help bring spending back in line.")
            elif diff < 0:
                return f"Great news! Your expenses actually decreased by ₹{abs(diff):,.0f} ({abs(pct)}%) compared to last month."
            else:
                return "Your total expenses are virtually identical to last month's numbers."

        # 6. Goals or Emergency fund
        if "goal" in msg or "emergency" in msg:
            if not goals:
                return ("You don't have any active financial goals yet! I recommend starting with an 'Emergency Fund' goal "
                        f"worth 3 months of expenses (approx ₹{expenses * 3:,.0f}). You can add it anytime from the Goals tab.")
            goal_lines = "\n".join([f"• {g.goal_name}: ₹{g.current_amount:,.0f} of ₹{g.target_amount:,.0f} ({g.to_dict()['progress_percentage']}%)" for g in goals])
            return f"Here is the status of your current financial goals:\n{goal_lines}\nKeep contributing regularly to stay on schedule!"

        # 7. Overall analysis / Default greeting
        return (f"Hello {user.name}! Here is a snapshot of your finances this month:\n"
                f"• Income: ₹{income:,.0f}\n"
                f"• Expenses: ₹{expenses:,.0f}\n"
                f"• Net Savings: ₹{savings:,.0f} ({savings_rate}%)\n"
                f"• Top Expense: {top_categories[0]['category'] if top_categories else 'None'} (₹{top_categories[0]['amount']:,.0f})\n\n"
                f"How can I help you today? You can ask me how to save more, where you're overspending, or to generate a budget plan!")

    @staticmethod
    def _query_external_llm(api_key, user_message, context):
        """
        External LLM integration using Gemini or standard OpenAI-compatible completions.
        """
        prompt = f"""
You are an expert AI Personal Finance Advisor helping a user manage their money.
Use the following REAL financial numbers of the user to answer their question accurately.
Do not invent fictional numbers. Use Indian Rupee (₹) format.

USER FINANCIAL SNAPSHOT:
User: {context['user_name']} ({context['persona']})
Monthly Income: ₹{context['income']:,.0f}
Monthly Expenses: ₹{context['expenses']:,.0f}
Net Savings: ₹{context['savings']:,.0f} (Savings Rate: {context['savings_rate']}%)
Top Categories: {context['top_categories']}
Budget Alerts: {context['exceeded_budgets']}
Financial Goals: {context['goals']}

USER QUESTION:
"{user_message}"

Provide a friendly, practical, and data-backed response. Always remind them that this is educational planning assistance.
"""
        # Google Gemini API endpoint
        url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key={api_key}"
        headers = {"Content-Type": "application/json"}
        payload = {
            "contents": [{
                "parts": [{"text": prompt}]
            }]
        }
        res = requests.post(url, headers=headers, json=payload, timeout=12)
        if res.status_code == 200:
            data = res.json()
            return data["candidates"][0]["content"]["parts"][0]["text"]
        return None
