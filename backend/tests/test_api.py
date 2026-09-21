import os
import sys
import json
import pytest
from datetime import date

# Add project root to sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "../..")))

from backend.app import create_app, db
from backend.app.models.models import User, Income, Expense, Budget, FinancialGoal
from backend.config import TestingConfig

@pytest.fixture
def app():
    app = create_app(TestingConfig)
    with app.app_context():
        db.create_all()
        yield app
        db.session.remove()
        db.drop_all()

@pytest.fixture
def client(app):
    return app.test_client()

@pytest.fixture
def auth_headers(client):
    # Register and login test user
    client.post("/api/auth/register", json={
        "name": "Test User",
        "email": "test@example.com",
        "password": "Password123"
    })
    res = client.post("/api/auth/login", json={
        "email": "test@example.com",
        "password": "Password123"
    })
    data = res.get_json()
    token = data["token"]
    return {"Authorization": f"Bearer {token}"}


def test_auth_flow(client):
    # 1. Register
    reg = client.post("/api/auth/register", json={
        "name": "Kunal",
        "email": "kunal@test.com",
        "password": "SecurePass123"
    })
    assert reg.status_code == 201
    assert "token" in reg.get_json()

    # Duplicate registration should fail
    dup = client.post("/api/auth/register", json={
        "name": "Kunal",
        "email": "kunal@test.com",
        "password": "SecurePass123"
    })
    assert dup.status_code == 409

    # 2. Login
    login_res = client.post("/api/auth/login", json={
        "email": "kunal@test.com",
        "password": "SecurePass123"
    })
    assert login_res.status_code == 200
    token = login_res.get_json()["token"]

    # 3. Me endpoint
    me_res = client.get("/api/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert me_res.status_code == 200
    assert me_res.get_json()["user"]["email"] == "kunal@test.com"


def test_income_crud(client, auth_headers):
    # Add income
    res = client.post("/api/income", headers=auth_headers, json={
        "amount": 45000.0,
        "source": "Salary",
        "date": "2026-09-01",
        "description": "Monthly paycheck"
    })
    assert res.status_code == 201
    inc_id = res.get_json()["income"]["id"]

    # Negative amount validation
    bad_res = client.post("/api/income", headers=auth_headers, json={
        "amount": -500.0,
        "source": "Salary"
    })
    assert bad_res.status_code == 400

    # Get incomes
    get_res = client.get("/api/income", headers=auth_headers)
    assert get_res.status_code == 200
    assert get_res.get_json()["total_amount"] == 45000.0

    # Delete income
    del_res = client.delete(f"/api/income/{inc_id}", headers=auth_headers)
    assert del_res.status_code == 200


def test_expense_crud_and_validation(client, auth_headers):
    # Add expense
    res = client.post("/api/expenses", headers=auth_headers, json={
        "amount": 3500.0,
        "category": "Food",
        "description": "Grocery shopping",
        "date": "2026-09-05",
        "payment_method": "UPI"
    })
    assert res.status_code == 201
    exp_id = res.get_json()["expense"]["id"]

    # Negative expense validation
    bad_res = client.post("/api/expenses", headers=auth_headers, json={
        "amount": -100.0,
        "category": "Food"
    })
    assert bad_res.status_code == 400

    # List expenses
    list_res = client.get("/api/expenses?category=Food", headers=auth_headers)
    assert list_res.status_code == 200
    assert len(list_res.get_json()["expenses"]) == 1


def test_budget_calculations_and_overspending(client, auth_headers):
    today = date.today()
    # 1. Set budget of ₹3,000 for Food
    b_res = client.post("/api/budgets", headers=auth_headers, json={
        "category": "Food",
        "monthly_limit": 3000.0,
        "month": today.month,
        "year": today.year
    })
    assert b_res.status_code in [200, 201]

    # 2. Add an expense of ₹3,800 on Food in current month
    client.post("/api/expenses", headers=auth_headers, json={
        "amount": 3800.0,
        "category": "Food",
        "date": today.isoformat()
    })

    # 3. Check budget status
    res = client.get(f"/api/budgets?month={today.month}&year={today.year}", headers=auth_headers)
    assert res.status_code == 200
    data = res.get_json()
    food_budget = next(b for b in data["budgets"] if b["category"] == "Food")
    assert food_budget["is_exceeded"] is True
    assert food_budget["exceeded_by"] == 800.0
    assert food_budget["percentage_used"] > 100


def test_savings_and_dashboard_summary(client, auth_headers):
    today = date.today()
    # Income ₹50,000
    client.post("/api/income", headers=auth_headers, json={
        "amount": 50000.0,
        "source": "Salary",
        "date": today.isoformat()
    })
    # Expense ₹20,000
    client.post("/api/expenses", headers=auth_headers, json={
        "amount": 20000.0,
        "category": "Rent",
        "date": today.isoformat()
    })

    summary_res = client.get(f"/api/dashboard/summary?month={today.month}&year={today.year}", headers=auth_headers)
    assert summary_res.status_code == 200
    totals = summary_res.get_json()["totals"]
    assert totals["total_income"] == 50000.0
    assert totals["total_expenses"] == 20000.0
    assert totals["total_savings"] == 30000.0
    assert totals["savings_rate"] == 60.0


def test_goal_progress(client, auth_headers):
    # Create goal
    g_res = client.post("/api/goals", headers=auth_headers, json={
        "goal_name": "Emergency Fund",
        "target_amount": 100000.0,
        "current_amount": 25000.0
    })
    assert g_res.status_code == 201
    goal_id = g_res.get_json()["goal"]["id"]

    # Add funds
    prog_res = client.patch(f"/api/goals/{goal_id}/progress", headers=auth_headers, json={
        "add_amount": 15000.0
    })
    assert prog_res.status_code == 200
    goal = prog_res.get_json()["goal"]
    assert goal["current_amount"] == 40000.0
    assert goal["progress_percentage"] == 40.0


def test_ai_fallback_and_budget_generator(client, auth_headers):
    today = date.today()
    # Add income & expense
    client.post("/api/income", headers=auth_headers, json={
        "amount": 40000.0,
        "source": "Salary",
        "date": today.isoformat()
    })
    client.post("/api/expenses", headers=auth_headers, json={
        "amount": 15000.0,
        "category": "Food",
        "date": today.isoformat()
    })

    # Test AI analysis
    res = client.post("/api/ai/analyze", headers=auth_headers, json={
        "month": today.month,
        "year": today.year
    })
    assert res.status_code == 200
    data = res.get_json()
    assert "disclaimer" in data
    assert "health" in data

    # Test Chat fallback
    chat_res = client.post("/api/ai/chat", headers=auth_headers, json={
        "message": "Where am I spending too much?"
    })
    assert chat_res.status_code == 200
    assert "Food" in chat_res.get_json()["reply"]

    # Test Smart Budget Generator
    gen_res = client.post("/api/ai/generate-budget", headers=auth_headers, json={
        "monthly_income": 40000.0
    })
    assert gen_res.status_code == 200
    assert len(gen_res.get_json()["budgets"]) > 0
