# app/routes/__init__.py
# Exposes all route modules so main.py can import them cleanly.
from app.routes import dashboard, reports, roads, priority, repairs, verification

__all__ = ["dashboard", "reports", "roads", "priority", "repairs", "verification"]
