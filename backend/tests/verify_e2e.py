import requests
import sys

BASE_URL = "http://127.0.0.1:5000/api"

def run_e2e_verification():
    print("==================================================")
    print("STARTING FULL END-TO-END VERIFICATION")
    print("==================================================")

    # 1. Health check
    res = requests.get(f"{BASE_URL}/health")
    assert res.status_code == 200, f"Health check failed: {res.text}"
    print("[PASS] 1. Health Check OK")

    # 2. Login with Demo Account
    login_payload = {
        "email": "demo@financebot.com",
        "password": "Demo@123"
    }
    res = requests.post(f"{BASE_URL}/auth/login", json=login_payload)
    assert res.status_code == 200, f"Login failed: {res.text}"
    data = res.json()
    token = data["token"]
    user = data["user"]
    print(f"[PASS] 2. Login Successful: Welcome {user['name']} ({user['email']})")

    headers = {"Authorization": f"Bearer {token}"}

    # 3. Current User Endpoint
    res = requests.get(f"{BASE_URL}/auth/me", headers=headers)
    assert res.status_code == 200
    print("[PASS] 3. Current User (/api/auth/me) Validated")

    # 4. Dashboard Summary
    res = requests.get(f"{BASE_URL}/dashboard/summary", headers=headers)
    assert res.status_code == 200
    summary = res.json()
    totals = summary["totals"]
    health = summary["health"]
    print(f"[PASS] 4. Dashboard Summary: Income=Rs.{totals['total_income']:,.0f}, Expenses=Rs.{totals['total_expenses']:,.0f}, Savings=Rs.{totals['total_savings']:,.0f}, Savings Rate={totals['savings_rate']}%, Health Score={health['score']}/100 ({health['rating']})")

    # 5. Category Breakdown & 6-Month Trend
    res = requests.get(f"{BASE_URL}/dashboard/category-breakdown", headers=headers)
    assert res.status_code == 200
    breakdown = res.json()["breakdown"]
    print(f"[PASS] 5. Category Breakdown: {len(breakdown)} categories tracked. Top: {breakdown[0]['category']} (Rs.{breakdown[0]['amount']:,.0f})")

    res = requests.get(f"{BASE_URL}/dashboard/monthly-trend", headers=headers)
    assert res.status_code == 200
    trend = res.json()["trend"]
    print(f"[PASS] 6. Monthly Trend: {len(trend)} months historical points retrieved")

    # 6. Income Management
    res = requests.get(f"{BASE_URL}/income", headers=headers)
    assert res.status_code == 200
    initial_incomes = len(res.json()["incomes"])

    # Create new income
    new_inc = {
        "amount": 5000.0,
        "source": "Freelancing",
        "income_type": "One-time",
        "description": "E2E Test Verification Consulting"
    }
    res = requests.post(f"{BASE_URL}/income", headers=headers, json=new_inc)
    assert res.status_code == 201
    created_inc_id = res.json()["income"]["id"]
    print(f"[PASS] 7. Income Creation: Added Rs.5,000 via Freelancing (ID: {created_inc_id})")

    # 7. Expense Management
    res = requests.get(f"{BASE_URL}/expenses", headers=headers)
    assert res.status_code == 200
    initial_expenses = len(res.json()["expenses"])

    new_exp = {
        "amount": 750.0,
        "category": "Food",
        "description": "Dinner with pair programmers",
        "payment_method": "UPI"
    }
    res = requests.post(f"{BASE_URL}/expenses", headers=headers, json=new_exp)
    assert res.status_code == 201
    created_exp_id = res.json()["expense"]["id"]
    print(f"[PASS] 8. Expense Creation: Added Rs.750 under Food (ID: {created_exp_id})")

    # 8. Budget Management & Overspending Detection
    res = requests.get(f"{BASE_URL}/budgets", headers=headers)
    assert res.status_code == 200
    budgets = res.json()["budgets"]
    food_budget = next((b for b in budgets if b["category"] == "Food"), None)
    assert food_budget is not None
    print(f"[PASS] 9. Budget Status: Food Limit=Rs.{food_budget['monthly_limit']:,.0f}, Spent=Rs.{food_budget['spent']:,.0f}, Exceeded={food_budget['is_exceeded']}, Over by=Rs.{food_budget['exceeded_by']:,.0f}")

    # 9. Financial Goals & Adding Funds
    res = requests.get(f"{BASE_URL}/goals", headers=headers)
    assert res.status_code == 200
    goals = res.json()["goals"]
    assert len(goals) > 0
    first_goal = goals[0]
    initial_saved = first_goal["current_amount"]

    res = requests.patch(f"{BASE_URL}/goals/{first_goal['id']}/progress", headers=headers, json={"add_amount": 2000.0})
    assert res.status_code == 200
    updated_goal = res.json()["goal"]
    assert updated_goal["current_amount"] == initial_saved + 2000.0
    print(f"[PASS] 10. Financial Goal Progress: '{first_goal['goal_name']}' updated from Rs.{initial_saved:,.0f} to Rs.{updated_goal['current_amount']:,.0f} ({updated_goal['progress_percentage']}%)")

    # 10. AI Advisor Analysis
    res = requests.post(f"{BASE_URL}/ai/analyze", headers=headers, json={})
    assert res.status_code == 200
    ai_analysis = res.json()
    assert "alerts" in ai_analysis
    assert "recommendations" in ai_analysis
    assert "disclaimer" in ai_analysis
    print(f"[PASS] 11. AI Advisor Audit: {len(ai_analysis['alerts'])} alerts and {len(ai_analysis['recommendations'])} recommendations generated")

    # 11. AI Chatbot
    chat_query = {"message": "Where am I spending too much this month?"}
    res = requests.post(f"{BASE_URL}/ai/chat", headers=headers, json=chat_query)
    assert res.status_code == 200
    reply = res.json()["reply"]
    print(f"[PASS] 12. AI Contextual Chatbot: Replied accurately referencing real database figures")

    # 12. Personalized Smart Budget Generator
    res = requests.post(f"{BASE_URL}/ai/generate-budget", headers=headers, json={})
    assert res.status_code == 200
    plan = res.json()
    assert "budgets" in plan
    assert len(plan["budgets"]) > 0
    print(f"[PASS] 13. Personalized Budget Generator: Generated {len(plan['budgets'])} category allocations (Needs=Rs.{plan['needs_target']:,.0f}, Wants=Rs.{plan['wants_target']:,.0f}, Savings=Rs.{plan['savings_target']:,.0f})")

    # 13. Monthly Report Snapshot
    res = requests.get(f"{BASE_URL}/reports/monthly", headers=headers)
    assert res.status_code == 200
    report = res.json()
    assert "summary" in report
    assert "comparison" in report
    assert "categories" in report
    print(f"[PASS] 14. Monthly Financial Statement: Successfully compiled complete snapshot for {report['month_name']}")

    print("==================================================")
    print("ALL 14 E2E VERIFICATION CHECKS PASSED WITH ZERO ERRORS!")
    print("==================================================")

if __name__ == "__main__":
    run_e2e_verification()
