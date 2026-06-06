from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI, Request, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.core.config import settings
from app.core.database import create_tables
from app.routes.ai_routes import router as ai_router
from app.routes.admin_routes import router as admin_router
from app.routes.analytics_routes import router as analytics_router
from app.routes.auth_routes import router as auth_router
from app.routes.checkin_routes import router as checkin_router
from app.routes.escalation_routes import router as escalation_router
from app.routes.goal_routes import router as goal_router
from app.routes.manager_routes import router as manager_router
from app.routes.performance_routes import router as performance_router
from app.routes.prediction_routes import router as prediction_router
from app.routes.recognition_routes import router as recognition_router


from app.middleware.trace import TraceMiddleware
from app.middleware.metrics import MetricsMiddleware
from app.middleware.rate_limit import RateLimitMiddleware

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Create DB tables on startup."""
    import os
    app.state.env = os.getenv("ENV", "development")
    await create_tables()
    yield


app = FastAPI(
    title="GoalForge AI",
    description="AI-powered goal management & performance intelligence API",
    version="2.0.0",
    lifespan=lifespan,
)

# Register Tracing, Metrics, and Rate Limiting middlewares
app.add_middleware(RateLimitMiddleware)
app.add_middleware(MetricsMiddleware)
app.add_middleware(TraceMiddleware)

# Strip /api prefix when routed through Vercel's proxy
@app.middleware("http")
async def strip_api_prefix(request, call_next):
    path = request.scope.get("path", "")
    if path.startswith("/api"):
        # Internally route to the path without /api
        request.scope["path"] = path[len("/api"):]
    response = await call_next(request)
    return response


_cors_origins = settings.cors_origin_list
app.add_middleware(
    CORSMiddleware,
    allow_origins=_cors_origins,
    allow_credentials="*" not in _cors_origins,
    allow_methods=["*"],
    allow_headers=["*"],
)

_uploads_dir = Path(__file__).resolve().parent.parent / "uploads"
_uploads_avatars = _uploads_dir / "avatars"
_uploads_avatars.mkdir(parents=True, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=str(_uploads_dir)), name="uploads")


@app.get("/health")
async def health():
    # Database ping check
    db_status = "healthy"
    try:
        from app.core.database import async_session
        from sqlalchemy import text
        async with async_session() as session:
            await session.execute(text("SELECT 1"))
    except Exception as e:
        db_status = f"unhealthy: {str(e)}"
        
    # Memory RSS footprints check
    try:
        import psutil
        process = psutil.Process()
        memory_usage_mb = process.memory_info().rss / (1024 * 1024)
    except Exception:
        memory_usage_mb = "N/A"

    return {
        "status": "ok" if "unhealthy" not in db_status else "error",
        "service": "goalforge-api",
        "database": db_status,
        "memory_usage_mb": memory_usage_mb
    }


@app.get("/seed")
async def run_seed():
    """Run migrations first, then seed admin/manager/employee in a fresh session."""
    if not settings.DEBUG:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Seeding is not permitted in production environment."
        )

    from app.core.database import async_session
    from sqlalchemy import text
    
    try:
        # Fix PostgreSQL auto-increment sequences
        env = getattr(app.state, "env", "development")
        async with async_session() as db:
            if env == "development" and db.bind.dialect.name == "postgresql":
                for table, col in [
                    ("users", "id"),
                    ("audit_logs", "id"),
                    ("goals", "id"),
                    ("checkins", "id"),
                    ("cycles", "id"),
                    ("escalations", "id"),
                    ("milestones", "id"),
                    ("notifications", "id"),
                    ("performance_scores", "id"),
                    ("recognitions", "id"),
                    ("shared_goals", "id"),
                ]:
                    try:
                        await db.execute(text(f"""
                            SELECT setval(
                                pg_get_serial_sequence('{table}', '{col}'), 
                                COALESCE((SELECT MAX({col}) FROM {table}), 0) + 1, 
                                false
                            );
                        """))
                        await db.commit()
                    except Exception as seq_err:
                        import logging
                        logging.warning(f"Skipping sequence reset for {table}: {seq_err}")
        
        # Step 2: Approve existing users or create new ones
        from sqlalchemy import select
        from app.models.user import User
        from app.core.security import hash_password
        
        async with async_session() as db2:
            for email, name, role, dept in [
                ('admin@goalforge.ai', 'Admin', 'admin', 'HQ'),
                ('manager@goalforge.ai', 'Manager', 'manager', 'Sales'),
                ('employee@goalforge.ai', 'Employee', 'employee', 'Engineering'),
            ]:
                result = await db2.execute(select(User).where(User.email == email))
                user = result.scalar_one_or_none()
                if user:
                    user.is_approved = True
                    user.is_active = True
                else:
                    user = User(
                        name=name, email=email, role=role, department=dept,
                        password_hash=hash_password('password123'),
                        is_approved=True, is_active=True,
                    )
                    db2.add(user)
            await db2.commit()
            
        return {"status": "migrations and seed successful"}
    except Exception as e:
        import traceback
        return {"status": "error", "detail": str(e), "traceback": traceback.format_exc()}

@app.get("/metrics")
def metrics(request: Request):
    client_host = request.client.host if request.client else None
    if client_host not in ("127.0.0.1", "::1", "localhost", "testserver", "testclient"):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied. metrics endpoint is only available locally."
        )
    from prometheus_client import generate_latest, CONTENT_TYPE_LATEST
    from fastapi import Response
    return Response(generate_latest(), media_type=CONTENT_TYPE_LATEST)


@app.get("/")
def home():
    return {
        "message": "GoalForge AI Backend Running",
        "version": "2.0.0",
        "features": [
            "Goal Management",
            "AI Milestone Planning",
            "Performance Intelligence",
            "Predictive Analytics",
            "Employee Recognition",
            "Escalation Monitoring",
        ],
    }


# Register API Endpoints
app.include_router(auth_router)
app.include_router(goal_router)
app.include_router(checkin_router)
app.include_router(ai_router)
app.include_router(manager_router)
app.include_router(admin_router)
app.include_router(analytics_router)
app.include_router(performance_router)
app.include_router(prediction_router)
app.include_router(recognition_router)
app.include_router(escalation_router)