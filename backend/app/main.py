from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.database import create_tables
from fastapi.staticfiles import StaticFiles
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


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Create DB tables on startup."""
    await create_tables()
    yield


app = FastAPI(
    title="GoalForge AI",
    description="AI-powered goal management & performance intelligence API",
    version="2.0.0",
    lifespan=lifespan,
)


# Strip /api prefix when routed through Vercel's proxy
@app.middleware("http")
async def strip_api_prefix(request, call_next):
    path = request.scope.get("path", "")
    if path.startswith("/api"):
        # Internally route to the path without /api
        request.scope["path"] = path[len("/api"):]
    response = await call_next(request)
    return response


app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")


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