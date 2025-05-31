from pydantic import BaseModel
from typing import Optional
from datetime import datetime
from enum import Enum

class HackRequestStatus(str, Enum):
    PENDING = "pending"
    ACCEPTED = "accepted"
    REJECTED = "rejected"

class HackRequestCreate(BaseModel):
    recipient_id: int
    hackathon_id: Optional[int] = None
    team_id: Optional[int] = None
    message: Optional[str] = None

class HackRequestResponse(BaseModel):
    id: int
    sender_id: int
    recipient_id: int
    hackathon_id: Optional[int]
    team_id: Optional[int]
    message: Optional[str]
    status: HackRequestStatus
    created_at: datetime
    updated_at: Optional[datetime]
    
    class Config:
        from_attributes = True