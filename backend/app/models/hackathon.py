from sqlalchemy import Column, Integer, String, Text, DateTime, Boolean, JSON, Float
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base

class Hackathon(Base):
    __tablename__ = "hackathons"
    
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    organizer = Column(String(255), nullable=True)
    
    # Event Details
    start_date = Column(DateTime, nullable=False)
    end_date = Column(DateTime, nullable=False)
    registration_deadline = Column(DateTime, nullable=True)
    location = Column(String(255), nullable=True)  # "Online", "San Francisco, CA"
    event_type = Column(String(50), default="hybrid")  # online, offline, hybrid
    
    # Requirements
    max_team_size = Column(Integer, default=4)
    min_team_size = Column(Integer, default=1)
    eligibility = Column(JSON, default=list)  # ["Students", "Professionals"]
    
    # Categories & Prizes
    themes = Column(JSON, default=list)  # ["AI/ML", "Web Dev", "Blockchain"]
    prize_pool = Column(String(100), nullable=True)  # "$10,000"
    prizes = Column(JSON, default=list)  # [{"position": "1st", "amount": "$5000"}]
    
    # Metadata
    difficulty_level = Column(String(50), default="all")  # beginner, intermediate, advanced, all
    tags = Column(JSON, default=list)  # ["Remote", "24hr", "Students"]
    external_url = Column(String(255), nullable=True)
    image_url = Column(String(255), nullable=True)
    
    # Status
    is_active = Column(Boolean, default=True)
    is_featured = Column(Boolean, default=False)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    teams = relationship("Team", back_populates="hackathon")
    hack_requests = relationship("HackRequest", back_populates="hackathon")