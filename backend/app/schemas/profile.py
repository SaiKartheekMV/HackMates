from pydantic import BaseModel, HttpUrl, validator
from typing import Optional, List
from datetime import datetime

class ProfileBase(BaseModel):
    bio: Optional[str] = None
    location: Optional[str] = None
    phone: Optional[str] = None
    github_url: Optional[str] = None
    linkedin_url: Optional[str] = None
    portfolio_url: Optional[str] = None
    skills: List[str] = []
    experience_level: str = "beginner"
    interests: List[str] = []
    preferred_roles: List[str] = []
    availability: str = "weekends"
    team_size_preference: int = 4

class ProfileCreate(ProfileBase):
    pass

class ProfileUpdate(ProfileBase):
    pass

class ProfileResponse(ProfileBase):
    id: int
    user_id: int
    profile_score: float
    created_at: datetime
    updated_at: Optional[datetime]
    
    class Config:
        from_attributes = True