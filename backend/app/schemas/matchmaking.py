from pydantic import BaseModel
from typing import List, Optional, Dict
from datetime import datetime

class MatchPreferences(BaseModel):
    hackathon_id: Optional[int] = None
    preferred_skills: List[str] = []
    experience_level: Optional[str] = None
    location_preference: Optional[str] = None
    team_size: int = 4

class UserMatch(BaseModel):
    user_id: int
    username: str
    full_name: Optional[str]
    skills: List[str]
    experience_level: str
    location: Optional[str]
    bio: Optional[str]
    github_url: Optional[str]
    compatibility_score: float
    matching_skills: List[str]
    profile_score: float

class MatchResponse(BaseModel):
    matches: List[UserMatch]
    total_matches: int
    preferences_used: MatchPreferences