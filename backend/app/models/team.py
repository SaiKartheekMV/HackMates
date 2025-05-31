from sqlalchemy import Column, Integer, String, Text, ForeignKey, DateTime, Boolean, JSON
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base

class Team(Base):
    __tablename__ = "teams"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    hackathon_id = Column(Integer, ForeignKey("hackathons.id"), nullable=False)
    
    # Team Details
    max_members = Column(Integer, default=4)
    current_members = Column(Integer, default=1)
    required_skills = Column(JSON, default=list)  # ["Python", "React"]
    looking_for_roles = Column(JSON, default=list)  # ["Frontend Dev", "Designer"]
    
    # Project Info
    project_idea = Column(Text, nullable=True)
    tech_stack = Column(JSON, default=list)  # ["React", "Node.js", "MongoDB"]
    github_repo = Column(String(255), nullable=True)
    
    # Status
    is_public = Column(Boolean, default=True)  # Can others see and join
    is_complete = Column(Boolean, default=False)  # Team is full
    status = Column(String(50), default="forming")  # forming, working, submitted
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    hackathon = relationship("Hackathon", back_populates="teams")
    members = relationship("TeamMember", back_populates="team")

class TeamMember(Base):
    __tablename__ = "team_members"
    
    id = Column(Integer, primary_key=True, index=True)
    team_id = Column(Integer, ForeignKey("teams.id"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    
    role = Column(String(100), nullable=True)  # "Team Lead", "Frontend Dev"
    is_leader = Column(Boolean, default=False)
    joined_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    team = relationship("Team", back_populates="members")
    user = relationship("User", back_populates="team_memberships")

