from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from app.core.middleware import RequestContextMiddleware
from app.core.exceptions import AccessAIException
from app.core.logging import get_logger
from app.api.v1.router import api_v1_router

logger = get_logger("accessai.app")

app = FastAPI(
    title="AccessAI — Universal Access & Opportunity Intelligence Platform",
    description="A unified ecosystem for education, public services, career opportunities, and accessible information.",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url="/openapi.json",
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
