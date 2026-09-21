from datetime import datetime, date
import json
from werkzeug.security import generate_password_hash, check_password_hash
from backend.app import db

class User(db.Model):
    __tablename__ = "users"

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False, index=True)
    password_hash = db.Column(db.String(256), nullable=False)
    currency = db.Column(db.String(10), default="INR", nullable=False)
    persona = db.Column(db.String(50), default="Salaried", nullable=True) # Salaried, Student, Freelancer, Household
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    # Relationships
    incomes = db.relationship("Income", backref="user", lazy=True, cascade="all, delete-orphan")
    expenses = db.relationship("Expense", backref="user", lazy=True, cascade="all, delete-orphan")
    budgets = db.relationship("Budget", backref="user", lazy=True, cascade="all, delete-orphan")
    goals = db.relationship("FinancialGoal", backref="user", lazy=True, cascade="all, delete-orphan")
    conversations = db.relationship("AIConversation", backref="user", lazy=True, cascade="all, delete-orphan")
    reports = db.relationship("FinancialReport", backref="user", lazy=True, cascade="all, delete-orphan")

    def set_password(self, password):
        self.password_hash = generate_password_hash(password)

    def check_password(self, password):
        return check_password_hash(self.password_hash, password)

    def to_dict(self):
        return {
            "id": self.id,
            "name": self.name,
            "email": self.email,
            "currency": self.currency,
            "persona": self.persona,
            "created_at": self.created_at.isoformat(),
            "updated_at": self.updated_at.isoformat()
        }


class Income(db.Model):
    __tablename__ = "incomes"

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    amount = db.Column(db.Float, nullable=False)
    source = db.Column(db.String(100), nullable=False) # Salary, Freelancing, Part-time job, Business, Scholarship, Allowance, Other
    income_type = db.Column(db.String(50), default="Recurring", nullable=False) # Recurring, One-time
    date = db.Column(db.Date, nullable=False, default=date.today)
    description = db.Column(db.String(255), default="")
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)

    def to_dict(self):
        return {
            "id": self.id,
            "user_id": self.user_id,
            "amount": round(self.amount, 2),
            "source": self.source,
            "income_type": self.income_type,
            "date": self.date.isoformat() if self.date else "",
            "description": self.description,
            "created_at": self.created_at.isoformat()
        }


class Expense(db.Model):
    __tablename__ = "expenses"

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    amount = db.Column(db.Float, nullable=False)
    category = db.Column(db.String(100), nullable=False, index=True) # Food, Rent, Transport, Utilities, etc.
    description = db.Column(db.String(255), default="")
    date = db.Column(db.Date, nullable=False, default=date.today)
    payment_method = db.Column(db.String(50), default="UPI", nullable=False) # UPI, Credit Card, Debit Card, Cash, Net Banking
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    def to_dict(self):
        return {
            "id": self.id,
            "user_id": self.user_id,
            "amount": round(self.amount, 2),
            "category": self.category,
            "description": self.description,
            "date": self.date.isoformat() if self.date else "",
            "payment_method": self.payment_method,
            "created_at": self.created_at.isoformat(),
            "updated_at": self.updated_at.isoformat()
        }


class Budget(db.Model):
    __tablename__ = "budgets"

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    category = db.Column(db.String(100), nullable=False)
    monthly_limit = db.Column(db.Float, nullable=False)
    month = db.Column(db.Integer, nullable=False) # 1 - 12
    year = db.Column(db.Integer, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)

    __table_args__ = (
        db.UniqueConstraint("user_id", "category", "month", "year", name="unique_user_cat_month_year"),
    )

    def to_dict(self):
        return {
            "id": self.id,
            "user_id": self.user_id,
            "category": self.category,
            "monthly_limit": round(self.monthly_limit, 2),
            "month": self.month,
            "year": self.year,
            "created_at": self.created_at.isoformat()
        }


class FinancialGoal(db.Model):
    __tablename__ = "financial_goals"

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    goal_name = db.Column(db.String(150), nullable=False)
    target_amount = db.Column(db.Float, nullable=False)
    current_amount = db.Column(db.Float, default=0.0, nullable=False)
    target_date = db.Column(db.Date, nullable=True)
    description = db.Column(db.String(255), default="")
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)

    def to_dict(self):
        remaining = max(0.0, round(self.target_amount - self.current_amount, 2))
        percentage = min(100.0, round((self.current_amount / self.target_amount * 100), 1)) if self.target_amount > 0 else 0.0
        return {
            "id": self.id,
            "user_id": self.user_id,
            "goal_name": self.goal_name,
            "target_amount": round(self.target_amount, 2),
            "current_amount": round(self.current_amount, 2),
            "remaining_amount": remaining,
            "progress_percentage": percentage,
            "target_date": self.target_date.isoformat() if self.target_date else None,
            "description": self.description,
            "is_completed": self.current_amount >= self.target_amount,
            "created_at": self.created_at.isoformat()
        }


class AIConversation(db.Model):
    __tablename__ = "ai_conversations"

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    role = db.Column(db.String(20), nullable=False) # 'user' or 'assistant'
    content = db.Column(db.Text, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)

    def to_dict(self):
        return {
            "id": self.id,
            "user_id": self.user_id,
            "role": self.role,
            "content": self.content,
            "created_at": self.created_at.isoformat()
        }


class FinancialReport(db.Model):
    __tablename__ = "financial_reports"

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    month = db.Column(db.Integer, nullable=False)
    year = db.Column(db.Integer, nullable=False)
    summary_json = db.Column(db.Text, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)

    def to_dict(self):
        data = {}
        try:
            data = json.loads(self.summary_json)
        except Exception:
            pass
        return {
            "id": self.id,
            "user_id": self.user_id,
            "month": self.month,
            "year": self.year,
            "summary": data,
            "created_at": self.created_at.isoformat()
        }
