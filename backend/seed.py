import os
import sys
from datetime import date, timedelta

# Ensure backend root is on sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from backend.app import create_app, db
from backend.app.models.models import User, Income, Expense, Budget, FinancialGoal

def seed_database():
    app = create_app()
    with app.app_context():
        # Create all tables
        db.create_all()

        # Check if demo user already exists
        demo_email = "demo@financebot.com"
        user = User.query.filter_by(email=demo_email).first()

        if user:
            print(f"Demo user {demo_email} already exists. Re-populating fresh demonstration data...")
            # Clean existing user transactions
            Income.query.filter_by(user_id=user.id).delete()
            Expense.query.filter_by(user_id=user.id).delete()
            Budget.query.filter_by(user_id=user.id).delete()
            FinancialGoal.query.filter_by(user_id=user.id).delete()
            db.session.commit()
        else:
            print(f"Creating demo user {demo_email}...")
            user = User(
                name="Aarav Sharma",
                email=demo_email,
                persona="Salaried",
                currency="INR"
            )
            user.set_password("Demo@123")
            db.session.add(user)
            db.session.commit()

        today = date.today()
        current_month = today.month
        current_year = today.year

        prev_month = 12 if current_month == 1 else current_month - 1
        prev_year = current_year - 1 if current_month == 1 else current_year

        two_months_ago = 12 if prev_month == 1 else prev_month - 1
        two_months_ago_year = prev_year - 1 if prev_month == 1 else prev_year

        print("Seeding multi-month realistic financial data (INR)...")

        # 1. Incomes for Current Month
        incomes = [
            Income(user_id=user.id, amount=52000.0, source="Salary", income_type="Recurring", date=date(current_year, current_month, 1), description="Monthly Corporate Tech Salary"),
            Income(user_id=user.id, amount=12500.0, source="Freelancing", income_type="One-time", date=date(current_year, current_month, 12), description="UI/UX Web Design Project"),
            Income(user_id=user.id, amount=2800.0, source="Business", income_type="Recurring", date=date(current_year, current_month, 18), description="Mutual Fund / Stock Dividends")
        ]

        # Incomes for Previous Month
        incomes_prev = [
            Income(user_id=user.id, amount=52000.0, source="Salary", income_type="Recurring", date=date(prev_year, prev_month, 1), description="Monthly Corporate Tech Salary"),
            Income(user_id=user.id, amount=8000.0, source="Freelancing", income_type="One-time", date=date(prev_year, prev_month, 15), description="Content Consulting Work")
        ]

        # Incomes for 2 Months Ago
        incomes_2m = [
            Income(user_id=user.id, amount=50000.0, source="Salary", income_type="Recurring", date=date(two_months_ago_year, two_months_ago, 1), description="Monthly Corporate Tech Salary")
        ]

        db.session.add_all(incomes + incomes_prev + incomes_2m)

        # 2. Expenses for Current Month (engineered to show overspending on Food and Shopping)
        expenses_curr = [
            Expense(user_id=user.id, amount=16000.0, category="Rent", description="2BHK Apartment Rent", date=date(current_year, current_month, 2), payment_method="Net Banking"),
            Expense(user_id=user.id, amount=7400.0, category="Groceries", description="Nature's Basket & DMart Grocery Run", date=date(current_year, current_month, 5), payment_method="Credit Card"),
            Expense(user_id=user.id, amount=5850.0, category="Food", description="Swiggy, Zomato & Weekend Dinners", date=date(current_year, current_month, 8), payment_method="UPI"),
            Expense(user_id=user.id, amount=3200.0, category="Transport", description="Metro Pass & Petrol Fuel", date=date(current_year, current_month, 10), payment_method="UPI"),
            Expense(user_id=user.id, amount=2450.0, category="Utilities", description="Electricity & High-speed Fiber Internet", date=date(current_year, current_month, 11), payment_method="UPI"),
            Expense(user_id=user.id, amount=4800.0, category="Shopping", description="New Clothes & Footwear (Festival Sale)", date=date(current_year, current_month, 14), payment_method="Credit Card"),
            Expense(user_id=user.id, amount=2600.0, category="Entertainment", description="Cinema IMAX tickets & OTT Subscriptions", date=date(current_year, current_month, 16), payment_method="Credit Card"),
            Expense(user_id=user.id, amount=1200.0, category="Bills", description="Mobile Postpaid & Gym Membership recharge", date=date(current_year, current_month, 17), payment_method="UPI"),
            Expense(user_id=user.id, amount=1500.0, category="Healthcare", description="Pharmacy Medicines & Annual Dental Checkup", date=date(current_year, current_month, 19), payment_method="Debit Card")
        ]

        # Expenses for Previous Month
        expenses_prev = [
            Expense(user_id=user.id, amount=16000.0, category="Rent", description="Apartment Rent", date=date(prev_year, prev_month, 2), payment_method="Net Banking"),
            Expense(user_id=user.id, amount=6900.0, category="Groceries", description="Monthly Staples", date=date(prev_year, prev_month, 4), payment_method="Credit Card"),
            Expense(user_id=user.id, amount=4200.0, category="Food", description="Dining & Cafes", date=date(prev_year, prev_month, 9), payment_method="UPI"),
            Expense(user_id=user.id, amount=2900.0, category="Transport", description="Fuel & Auto rides", date=date(prev_year, prev_month, 11), payment_method="UPI"),
            Expense(user_id=user.id, amount=2300.0, category="Utilities", description="Electricity & WiFi", date=date(prev_year, prev_month, 13), payment_method="UPI"),
            Expense(user_id=user.id, amount=2800.0, category="Shopping", description="Books and home essentials", date=date(prev_year, prev_month, 16), payment_method="Credit Card"),
            Expense(user_id=user.id, amount=2100.0, category="Entertainment", description="Streaming subscriptions & outings", date=date(prev_year, prev_month, 20), payment_method="Debit Card")
        ]

        # Expenses for 2 Months Ago
        expenses_2m = [
            Expense(user_id=user.id, amount=16000.0, category="Rent", description="Apartment Rent", date=date(two_months_ago_year, two_months_ago, 2), payment_method="Net Banking"),
            Expense(user_id=user.id, amount=6500.0, category="Groceries", description="Monthly Staples", date=date(two_months_ago_year, two_months_ago, 5), payment_method="Credit Card"),
            Expense(user_id=user.id, amount=4100.0, category="Food", description="Dining & snacks", date=date(two_months_ago_year, two_months_ago, 10), payment_method="UPI"),
            Expense(user_id=user.id, amount=2800.0, category="Transport", description="Commute", date=date(two_months_ago_year, two_months_ago, 12), payment_method="UPI"),
            Expense(user_id=user.id, amount=2100.0, category="Utilities", description="Utility bills", date=date(two_months_ago_year, two_months_ago, 15), payment_method="UPI")
        ]

        db.session.add_all(expenses_curr + expenses_prev + expenses_2m)

        # 3. Monthly Budgets for Current Month
        budgets = [
            Budget(user_id=user.id, category="Food", monthly_limit=5000.0, month=current_month, year=current_year), # Over budget by ₹850
            Budget(user_id=user.id, category="Rent", monthly_limit=16000.0, month=current_month, year=current_year), # 100% utilized
            Budget(user_id=user.id, category="Groceries", monthly_limit=8000.0, month=current_month, year=current_year), # 92% utilized
            Budget(user_id=user.id, category="Transport", monthly_limit=4000.0, month=current_month, year=current_year), # 80% utilized
            Budget(user_id=user.id, category="Utilities", monthly_limit=3000.0, month=current_month, year=current_year), # 81% utilized
            Budget(user_id=user.id, category="Shopping", monthly_limit=3500.0, month=current_month, year=current_year), # Over budget by ₹1,300
            Budget(user_id=user.id, category="Entertainment", monthly_limit=3000.0, month=current_month, year=current_year), # 86% utilized
            Budget(user_id=user.id, category="Bills", monthly_limit=2000.0, month=current_month, year=current_year)
        ]
        db.session.add_all(budgets)

        # 4. Financial Goals
        goals = [
            FinancialGoal(
                user_id=user.id,
                goal_name="Emergency Fund (6 Months)",
                target_amount=150000.0,
                current_amount=98000.0,
                target_date=date(current_year + 1, 3, 31),
                description="High liquidity safety buffer for medical emergencies or unplanned expenses."
            ),
            FinancialGoal(
                user_id=user.id,
                goal_name="New Tech Workstation / Laptop",
                target_amount=85000.0,
                current_amount=56000.0,
                target_date=date(current_year, 12, 31),
                description="Apple M-Series workstation for freelance coding and design projects."
            ),
            FinancialGoal(
                user_id=user.id,
                goal_name="Goa Holiday with Family",
                target_amount=30000.0,
                current_amount=22500.0,
                target_date=date(current_year, 11, 15),
                description="Year-end beach retreat and flights."
            )
        ]
        db.session.add_all(goals)

        db.session.commit()
        print("[OK] Database successfully seeded with demo user and transactions!")
        print("  Email: demo@financebot.com")
        print("  Password: Demo@123")

if __name__ == "__main__":
    seed_database()
