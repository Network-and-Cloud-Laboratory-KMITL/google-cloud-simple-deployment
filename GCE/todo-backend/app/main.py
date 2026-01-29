from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.routers import tasks, tags, stats

app = FastAPI(
    title="Todo Dashboard API",
    description="Backend API for the Todo Dashboard application",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    return JSONResponse(
        status_code=500,
        content={
            "error": {
                "code": "INTERNAL_ERROR",
                "message": "An unexpected error occurred",
                "details": {"error": str(exc)},
            }
        },
    )


app.include_router(tasks.router, prefix="/api/v1")
app.include_router(tags.router, prefix="/api/v1")
app.include_router(stats.router, prefix="/api/v1")


@app.get("/")
def root():
    return {
        "message": "Welcome to Todo Dashboard API",
        "docs": "/docs",
        "version": "1.0.0",
    }


@app.get("/health")
def health_check():
    return {"status": "healthy"}
