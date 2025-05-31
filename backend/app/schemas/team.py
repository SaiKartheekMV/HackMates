from pydantic import BaseModel, validator
from typing import Optional, List, Dict
from datetime import datetime

class TeamBase(BaseModel):
    name: str
    description: Optional[str] = None
    max_members: int = 4
    required_skills: List[str] = []
    looking_for_roles: List[str] = []
    project_idea: Optional[str] = None
    tech_stack: List[str] = []
    is_public: bool = True

class TeamCreate(TeamBase):
    hackathon_id: int
    
    @validator('max_members')
    def validate_max_members(cls, v):
        if v < 1 or v > 10:
            raise ValueError('Team size must be between 1 and 10')
        return v

class TeamUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    required_skills: Optional[List[str]] = None
    looking_for_roles: Optional[List[str]] = None
    project_idea: Optional[str] = None
    tech_stack: Optional[List[str]] = None
    is_public: Optional[bool] = None

class TeamMemberResponse(BaseModel):
    id: int
    user_id: int
    username: str
    full_name: Optional[str]
    role: Optional[str]
    is_leader: bool
    joined_at: datetime
    
    class Config:
        from_attributes = True

class TeamResponse(TeamBase):
    id: int
    hackathon_id: int
    current_members: int
    status: str
    created_at: datetime
    members: List[TeamMemberResponse] = []
    
    class Config:
        from_attributes = True