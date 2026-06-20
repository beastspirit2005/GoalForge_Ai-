from __future__ import annotations
from contextlib import asynccontextmanager
from pathlib import Path
import os
from dotenv import load_dotenv

# Force override OS environment variables with .env values
load_dotenv(Path(__file__).resolve().parents[2] / ".env", override=True)

import sys
backend_dir = Path(__file__).resolve().parents[1]
if str(backend_dir) not in sys.path:
    sys.path.insert(0, str(backend_dir))

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
from app.routes.task_routes import router as task_router

# Enterprise V2 routes
from app.routes.ai_recommendation_routes import router as ai_recommend_router
from app.routes.workload_routes import router as workload_router
from app.routes.risk_prediction_routes import router as risk_router
from app.routes.capacity_routes import router as capacity_router
from app.routes.gamification_routes import router as gamification_router
from app.routes.talent_search_routes import router as talent_router
from app.routes.dependency_routes import router as dependency_router
from app.routes.skill_intelligence_routes import router as skill_intelligence_router


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
    debug=settings.DEBUG,
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
        stripped = path[len("/api"):] or "/"
        # Only strip if the stripped path could match a registered route
        route_paths = [r.path for r in app.routes if hasattr(r, "path")]
        if any(stripped == rp or stripped.startswith(rp + "/") or rp.startswith(stripped.split("/{" )[0]) for rp in route_paths):
            request.scope["path"] = stripped
    response = await call_next(request)
    return response


_cors_origins = settings.cors_origin_list

# In development with wildcard origins, add explicit localhost entries
# so that credentials (cookies) work correctly during local development.
# The CORS spec forbids allow_credentials=True with allow_origins=["*"].
if "*" in _cors_origins and settings.DEBUG:
    _cors_origins = [
        "http://localhost:3000",
        "http://localhost:8000",
        "http://127.0.0.1:3000",
        "http://127.0.0.1:8000",
    ]

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



@app.get("/metrics")
def metrics(request: Request):
    # Block proxy-forwarded requests to prevent IP spoofing
    if request.headers.get("x-forwarded-for") or request.headers.get("x-real-ip"):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Metrics endpoint cannot be accessed through a proxy.",
        )
    client_host = request.client.host if request.client else None
    allowed_hosts = ("127.0.0.1", "::1", "localhost", "testserver", "testclient")
    if client_host not in allowed_hosts:
        # External access requires Bearer token authentication
        auth_header = request.headers.get("authorization", "")
        expected = f"Bearer {settings.SECRET_KEY}"
        if auth_header != expected:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access denied. Metrics endpoint is only available locally or with valid authorization.",
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
app.include_router(task_router)

# Enterprise V2 routers
app.include_router(ai_recommend_router)
app.include_router(workload_router)
app.include_router(risk_router)
app.include_router(capacity_router)
app.include_router(gamification_router)
app.include_router(talent_router)
app.include_router(dependency_router)
app.include_router(skill_intelligence_router)
