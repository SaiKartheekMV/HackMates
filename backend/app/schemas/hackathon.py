from pydantic import BaseModel, validator
from typing import Optional, List, Dict
from datetime import datetime

class HackathonBase(BaseModel):
    title: str
    description: Optional[str] = None
    organizer: Optional[str] = None
    start_date: datetime
    end_date: datetime
    registration_deadline: Optional[datetime] = None
    location: Optional[str] = None
    event_type: str = "hybrid"
    max_team_size: int = 4
    min_team_size: int = 1
    eligibility: List[str] = []
    themes: List[str] = []
    prize_pool: Optional[str] = None
    prizes: List[Dict] = []
    difficulty_level: str = "all"
    tags: List[str] = []
    external_url: Optional[str] = None
    image_url: Optional[str] = None

class HackathonCreate(HackathonBase):
    @validator('end_date')
    def end_date_after_start_date(cls, v, values):
        if 'start_date' in values and v <= values['start_date']:
            raise ValueError('End date must be after start date')
        return v

class HackathonResponse(HackathonBase):
    id: int
    is_active: bool
    is_featured: bool
    created_at: datetime
    
    class Config:
        from_attributes = True