from sqlalchemy import Column, Integer, String, Boolean, DateTime, Text
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base

class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, index=True, nullable=False)
    username = Column(String(100), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    full_name = Column(String(255), nullable=True)
    is_active = Column(Boolean, default=True)
    is_verified = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    profile = relationship("Profile", back_populates="user", uselist=False)
    sent_requests = relationship("HackRequest", foreign_keys="HackRequest.sender_id", back_populates="sender")
    received_requests = relationship("HackRequest", foreign_keys="HackRequest.receiver_id", back_populates="receiver")
    team_memberships = relationship("TeamMember", back_populates="user")
    sent_requests = relationship("HackRequest", foreign_keys="HackRequest.sender_id", back_populates="sender")
    received_requests = relationship("HackRequest", foreign_keys="HackRequest.recipient_id", back_populates="recipient")
