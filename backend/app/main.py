# hackmates-backend/app/main.py
from fastapi import FastAPI, HTTPException, Depends, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from contextlib import asynccontextmanager
import uvicorn

from database import engine, Base
from api.routes import auth, users, profiles, hackathons, matchmaking, teams, requests

# Create database tables
@asynccontextmanager
async def lifespan(app: FastAPI):
    # Create tables on startup
    Base.metadata.create_all(bind=engine)
    yield

# Initialize FastAPI app
app = FastAPI(
    title="HackMates API",
    description="AI-powered hackathon teammate matching platform",
    version="1.0.0",
    lifespan=lifespan
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:5173", "https://hackmates.vercel.app"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth.router, prefix="/api/auth", tags=["authentication"])
app.include_router(users.router, prefix="/api/user", tags=["users"])
app.include_router(profiles.router, prefix="/api/profile", tags=["profiles"])
app.include_router(hackathons.router, prefix="/api/hackathons", tags=["hackathons"])
app.include_router(matchmaking.router, prefix="/api/matchmaking", tags=["matchmaking"])
app.include_router(teams.router, prefix="/api/teams", tags=["teams"])
app.include_router(requests.router, prefix="/api/requests", tags=["requests"])

@app.get("/")
async def root():
    return {"message": "HackMates API is running!", "version": "1.0.0"}

@app.get("/health")
async def health_check():
    return {"status": "healthy", "message": "API is working perfectly"}

if __name__ == "__main__":
    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info"
    )