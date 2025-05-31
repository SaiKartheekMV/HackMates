from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import and_, func, text
from typing import Optional, List
import json
from app.database import get_db
from app.core.security import get_current_user
from app.models.user import User
from app.models.profile import Profile
from app.models.hackathon import Hackathon
from app.schemas.matchmaking import MatchPreferences, MatchResponse, UserMatch
from app.services.matchmaker import MatchmakingService

router = APIRouter()

@router.post("/", response_model=MatchResponse)
async def find_matches(
    preferences: MatchPreferences,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Find compatible teammates based on preferences"""
    
    # Get current user's profile
    current_profile = db.query(Profile).filter(Profile.user_id == current_user.id).first()
    if not current_profile:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Please complete your profile first"
        )
    
    # Use matchmaking service
    matchmaker = MatchmakingService(db)
    matches = matchmaker.find_matches(current_user.id, preferences) # type: ignore
    
    return MatchResponse(
        matches=matches,
        total_matches=len(matches),
        preferences_used=preferences
    )

@router.get("/quick", response_model=MatchResponse)
async def quick_match(
    limit: int = Query(5, le=20),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Quick match based on user's profile"""
    
    current_profile = db.query(Profile).filter(Profile.user_id == current_user.id).first()
    if not current_profile:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Please complete your profile first"
        )
    
    # Create preferences from user's profile
    preferences = MatchPreferences(
        preferred_skills=current_profile.skills[:5],  # Top 5 skills # type: ignore
        experience_level=current_profile.experience_level, # type: ignore
        team_size=current_profile.team_size_preference # type: ignore
    )
    
    matchmaker = MatchmakingService(db)
    matches = matchmaker.find_matches(current_user.id, preferences, limit=limit) # type: ignore
    
    return MatchResponse(
        matches=matches,
        total_matches=len(matches),
        preferences_used=preferences
    )

@router.get("/recommendations/{hackathon_id}", response_model=MatchResponse)
async def get_hackathon_recommendations(
    hackathon_id: int,
    limit: int = Query(10, le=50),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get teammate recommendations for specific hackathon"""
    
    # Verify hackathon exists
    hackathon = db.query(Hackathon).filter(Hackathon.id == hackathon_id).first()
    if not hackathon:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Hackathon not found"
        )
    
    current_profile = db.query(Profile).filter(Profile.user_id == current_user.id).first()
    if not current_profile:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Please complete your profile first"
        )
    
    # Create preferences based on hackathon themes and user profile
    preferences = MatchPreferences(
        hackathon_id=hackathon_id,
        preferred_skills=list(set(current_profile.skills + hackathon.themes)), # type: ignore
        experience_level=current_profile.experience_level, # type: ignore
        team_size=hackathon.max_team_size # type: ignore
    )
    
    matchmaker = MatchmakingService(db)
    matches = matchmaker.find_matches(current_user.id, preferences, limit=limit) # type: ignore
    
    return MatchResponse(
        matches=matches,
        total_matches=len(matches),
        preferences_used=preferences
    )