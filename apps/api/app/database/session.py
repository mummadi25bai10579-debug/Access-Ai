from typing import Generator, Dict, Any, Optional
from app.config import settings
from app.core.logging import get_logger

logger = get_logger(__name__)

try:
    from sqlalchemy import create_engine, text
    from sqlalchemy.orm import sessionmaker, Session, declarative_base
    HAS_SQLALCHEMY = True
    Base = declarative_base()

    # Configure connection pooling
    db_url = settings.DATABASE_URL
    if db_url.startswith("postgresql://") and not db_url.startswith("postgresql+"):
        db_url = db_url.replace("postgresql://", "postgresql+psycopg://", 1)

    try:
        engine = create_engine(
            db_url,
            pool_size=10,
            max_overflow=20,
            pool_pre_ping=True,
            pool_recycle=300,
            connect_args={"connect_timeout": 10} if "sqlite" not in db_url else {},
        )
        SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    except Exception as e:
        logger.warning(f"Could not connect to database at {db_url} ({e}); using lazy fallback engine.")
        engine = create_engine("sqlite:///:memory:", connect_args={"check_same_thread": False})
        SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

except ImportError:
    HAS_SQLALCHEMY = False
    Session = Any
    engine = None
    SessionLocal = None
    def declarative_base():
        class MockBase:
            __tablename__ = ""
        return MockBase
    Base = declarative_base()

def get_db() -> Generator[Any, None, None]:
    """
    FastAPI dependency that provides a transactional database session per request.
    Safely commits on success, rolls back on error, and closes the session.
    """
    if not HAS_SQLALCHEMY or not SessionLocal:
        yield None
        return

    db = SessionLocal()
    try:
        yield db
        db.commit()
    except Exception as e:
        db.rollback()
        logger.error(f"Database transaction error: {e}")
        raise
    finally:
        db.close()

def check_db_health() -> Dict[str, Any]:
    """
    Lightweight health check probe verifying active PostgreSQL database connectivity.
    """
    if not HAS_SQLALCHEMY or not engine:
        return {
            "status": "degraded",
            "database": "driver_not_installed",
            "note": "SQLAlchemy driver not found in runtime; using memory isolation repositories.",
        }

    try:
        from sqlalchemy import text
        with engine.connect() as conn:
            result = conn.execute(text("SELECT 1")).scalar()
            return {
                "status": "healthy" if result == 1 else "unhealthy",
                "database": "connected",
                "engine": engine.name,
            }
    except Exception as e:
        logger.warning(f"Database health check failed: {e}")
        return {
            "status": "unhealthy",
            "database": "disconnected",
            "error": str(e),
        }
