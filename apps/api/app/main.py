from contextlib import asynccontextmanager
from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from app.core.middleware import RequestContextMiddleware
from app.core.exceptions import AccessAIException, AIProviderError
from app.core.logging import get_logger
from app.api.v1.router import api_v1_router

logger = get_logger("accessai.app")

@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info(
        f"AccessAI backend starting up. Environment: {settings.APP_ENV}, "
        f"AI Provider: {settings.LLM_PROVIDER}, Embedding Model: {settings.EMBEDDING_MODEL}"
    )
    yield
    logger.info("AccessAI backend shutting down. Disposing database connection pool.")
    from app.database.session import engine
    if engine:
        try:
            engine.dispose()
        except Exception as e:
            logger.warning(f"Error during database engine disposal: {e}")

app = FastAPI(
    title="AccessAI — Universal Access & Opportunity Intelligence Platform",
    description="A unified ecosystem for education, public services, career opportunities, and accessible information.",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url="/openapi.json",
    lifespan=lifespan,
)

# CORS setup
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Custom context middleware
app.add_middleware(RequestContextMiddleware)

# Custom exception handling
@app.exception_handler(AIProviderError)
@app.exception_handler(AccessAIException)
async def accessai_exception_handler(request: Request, exc: AccessAIException):
    req_id = getattr(request.state, "request_id", "req-id")
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "success": False,
            "error": {
                "code": exc.code,
                "message": exc.message,
                "details": exc.details,
            },
            "request_id": req_id,
        },
        headers={"X-Request-ID": req_id},
    )

# Operational Health Endpoint
@app.get("/health", tags=["Health"])
@app.get("/api/v1/health", tags=["Health"])
async def health_check(request: Request):
    return {
        "success": True,
        "data": {
            "status": "healthy",
            "version": "1.0.0",
            "app_env": settings.APP_ENV,
            "database": "connected",
            "ai_provider": settings.LLM_PROVIDER,
            "architecture": "modular_monolith",
        },
        "request_id": getattr(request.state, "request_id", "req-id"),
    }

@app.get("/health/db", tags=["Health"])
@app.get("/api/v1/health/db", tags=["Health"])
async def db_health_check(request: Request):
    from app.database.session import check_db_health
    db_status = check_db_health()
    return {
        "success": db_status["status"] == "healthy",
        "data": db_status,
        "request_id": getattr(request.state, "request_id", "req-id"),
    }

@app.get("/health/ready", tags=["Health"])
@app.get("/api/v1/health/ready", tags=["Health"])
async def readiness_probe(request: Request):
    from app.database.session import check_db_health
    db_status = check_db_health()
    is_ready = db_status.get("status") == "healthy"
    return JSONResponse(
        status_code=200 if is_ready else 503,
        content={
            "success": is_ready,
            "status": "ready" if is_ready else "not_ready",
            "database": db_status,
            "request_id": getattr(request.state, "request_id", "req-id"),
        },
    )

@app.get("/health/live", tags=["Health"])
@app.get("/api/v1/health/live", tags=["Health"])
async def liveness_probe(request: Request):
    return {
        "success": True,
        "status": "alive",
        "request_id": getattr(request.state, "request_id", "req-id"),
    }

# Mount v1 router
app.include_router(api_v1_router, prefix=settings.API_V1_PREFIX)

@app.get("/", tags=["Root"])
async def root():
    return {
        "product": "AccessAI",
        "tagline": "Universal Access & Opportunity Intelligence Platform",
        "docs": "/docs",
        "health": "/api/v1/health",
    }
