from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Enum
from sqlalchemy.orm import relationship
from app.database import Base
import enum

class HackRequestStatus(enum.Enum):
    PENDING = "pending"
    ACCEPTED = "accepted"
    REJECTED = "rejected"

class HackRequest(Base):
    __tablename__ = "hack_requests"
    
    id = Column(Integer, primary_key=True, index=True)
    sender_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    recipient_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    hackathon_id = Column(Integer, ForeignKey("hackathons.id"), nullable=True)
    team_id = Column(Integer, ForeignKey("teams.id"), nullable=True)
    message = Column(String(500), nullable=True)
    status = Column(Enum(HackRequestStatus), default=HackRequestStatus.PENDING)
    created_at = Column(DateTime)
    updated_at = Column(DateTime)
    
    # Relationships
    sender = relationship("User", foreign_keys=[sender_id])
    recipient = relationship("User", foreign_keys=[recipient_id])
    hackathon = relationship("Hackathon")
    team = relationship("Team")