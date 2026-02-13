from fastapi import FastAPI
from fastapi import Request
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text
from pathlib import Path
from app.core.config import settings
from app.api.v1 import api_router
from app.db.session import engine

app = FastAPI(
    title=settings.PROJECT_NAME,
    openapi_url=f"{settings.API_V1_STR}/openapi.json"
)

# Startup event for automatic cleanup
@app.on_event("startup")
async def startup_event():
    from app.utils.cleanup import cleanup_old_media
    import threading
    # Ejecutar en un hilo separado para no retrasar el inicio de la app
    threading.Thread(target=cleanup_old_media, args=(30,), daemon=True).start()


allowed_origins = [o.strip() for o in settings.CORS_ORIGINS.split(",") if o.strip()]
app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type"],
)


@app.middleware("http")
async def add_security_headers(request: Request, call_next):
    response = await call_next(request)
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
    response.headers["Content-Security-Policy"] = (
        "default-src 'self'; img-src 'self' data: blob:; media-src 'self' blob:; "
        "script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'"
    )
    return response

# Include API routes
app.include_router(api_router, prefix=settings.API_V1_STR)

# Mount static files for PWA
app.mount("/static", StaticFiles(directory="static"), name="static")
# Ensure local uploads directory exists for environments without persistent disk provisioning.
Path("uploads").mkdir(parents=True, exist_ok=True)
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

from fastapi.responses import RedirectResponse

@app.get("/")
def read_root():
    return RedirectResponse(url="/static/index.html")


@app.get("/health/live")
def health_live():
    return {"status": "ok"}


@app.get("/health/ready")
def health_ready():
    try:
        with engine.connect() as conn:
            conn.execute(text("SELECT 1"))
        return {"status": "ready"}
    except Exception:
        return JSONResponse(status_code=503, content={"status": "not_ready"})

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
