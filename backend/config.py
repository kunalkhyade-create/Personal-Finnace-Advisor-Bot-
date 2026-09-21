import os
from datetime import timedelta
from dotenv import load_dotenv

load_dotenv()

BASE_DIR = os.path.abspath(os.path.dirname(__file__))

class Config:
    SECRET_KEY = os.getenv("SECRET_KEY", "finance-advisor-super-secret-key-2025")
    JWT_SECRET_KEY = os.getenv("JWT_SECRET_KEY", "jwt-secret-key-finance-bot-99")
    JWT_ACCESS_TOKEN_EXPIRES = timedelta(days=7)
    
    # Database: SQLite by default, easily swapped with PostgreSQL via DATABASE_URL
    SQLALCHEMY_DATABASE_URI = os.getenv(
        "DATABASE_URL",
        f"sqlite:///{os.path.join(BASE_DIR, 'finance.db')}"
    )
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    
    # AI Advisor configuration
    AI_API_KEY = os.getenv("AI_API_KEY", "")
    AI_PROVIDER = os.getenv("AI_PROVIDER", "gemini") # "gemini", "openai", or "fallback"
    
    # App Settings
    CURRENCY_SYMBOL = "₹"
    DEFAULT_CURRENCY = "INR"

class TestingConfig(Config):
    TESTING = True
    SQLALCHEMY_DATABASE_URI = "sqlite:///:memory:"
    WTF_CSRF_ENABLED = False
