import os
import sys

# Ensure backend root is on sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from backend.app import create_app, db
from backend.app.models.models import User
from backend.seed import seed_database

app = create_app()

if __name__ == "__main__":
    with app.app_context():
        db.create_all()
        # If no user exists, auto seed demo account
        if not User.query.filter_by(email="demo@financebot.com").first():
            print("No demo user detected. Auto-seeding initial database...")
            seed_database()

    port = int(os.getenv("PORT", 5000))
    debug = os.getenv("FLASK_DEBUG", "True").lower() in ["true", "1"]
    print(f"Starting Personal Finance Advisor API on http://127.0.0.1:{port}")
    app.run(host="0.0.0.0", port=port, debug=debug)
