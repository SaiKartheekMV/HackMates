from sqlalchemy import Column, Integer, String, Text, JSON, ForeignKey, DateTime, Float
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base

class Profile(Base):
    __tablename__ = "profiles"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), unique=True, nullable=False)
    
    # Basic Info
    bio = Column(Text, nullable=True)
    location = Column(String(255), nullable=True)
    phone = Column(String(20), nullable=True)
    github_url = Column(String(255), nullable=True)
    linkedin_url = Column(String(255), nullable=True)
    portfolio_url = Column(String(255), nullable=True)
    
    # Skills & Experience
    skills = Column(JSON, default=list)  # ["Python", "React", "AI"]
    experience_level = Column(String(50), default="beginner")  # beginner, intermediate, advanced
    interests = Column(JSON, default=list)  # ["Web Dev", "AI/ML", "Blockchain"]
    
    # Hackathon Preferences
    preferred_roles = Column(JSON, default=list)  # ["Frontend", "Backend", "UI/UX"]
    availability = Column(String(50), default="weekends")  # weekends, weekdays, flexible
    team_size_preference = Column(Integer, default=4)
    
    # AI/ML Fields
    resume_text = Column(Text, nullable=True)  # Extracted text from resume
    skills_embedding = Column(JSON, nullable=True)  # Vector embedding for matching
    profile_score = Column(Float, default=0.0)  # Completeness score
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    user = relationship("User", back_populates="profile")
