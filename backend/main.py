from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from api.workspaces import router as workspace_router
from api.config import router as config_router
from api.discovery import router as discovery_router

app = FastAPI(
    title="Agentic AI Platform",
    description="Intelligent B2B Customer Discovery",
    version="1.0.0"
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(workspace_router, prefix="/api/workspaces", tags=["Workspaces"])
app.include_router(config_router, prefix="/api/config", tags=["Configuration"])
app.include_router(discovery_router, prefix="/api/discovery", tags=["Discovery"])

@app.get("/")
async def root():
    return {"message": "Agentic AI Platform API", "version": "1.0.0"}

@app.get("/health")
async def health_check():
    return {"status": "healthy", "services": {"database": "ok", "redis": "ok"}}