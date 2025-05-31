from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import and_, or_
from typing import Optional, List
from datetime import datetime
from app.database import get_db
from app.core.security import get_current_user
from app.models.user import User
from app.models.hackathon import Hackathon
from app.schemas.hackathon import HackathonResponse, HackathonCreate

router = APIRouter()

@router.get("/", response_model=List[HackathonResponse])
async def get_hackathons(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, le=100),
    search: Optional[str] = Query(None),
    location: Optional[str] = Query(None),
    event_type: Optional[str] = Query(None),
    difficulty: Optional[str] = Query(None),
    theme: Optional[str] = Query(None),
    active_only: bool = Query(True),
    db: Session = Depends(get_db)
):
    """Get hackathons with filtering and pagination"""
    
    query = db.query(Hackathon)
    
    # Apply filters
    if active_only:
        query = query.filter(Hackathon.is_active == True)
        query = query.filter(Hackathon.end_date > datetime.utcnow())
    
    if search:
        query = query.filter(
            or_(
                Hackathon.title.ilike(f"%{search}%"),
                Hackathon.description.ilike(f"%{search}%"),
                Hackathon.organizer.ilike(f"%{search}%")
            )
        )
    
    if location:
        query = query.filter(Hackathon.location.ilike(f"%{location}%"))
    
    if event_type:
        query = query.filter(Hackathon.event_type == event_type)
    
    if difficulty and difficulty != "all":
        query = query.filter(
            or_(
                Hackathon.difficulty_level == difficulty,
                Hackathon.difficulty_level == "all"
            )
        )
    
    if theme:
        query = query.filter(Hackathon.themes.contains([theme]))
    
    # Order by featured first, then by start date
    query = query.order_by(Hackathon.is_featured.desc(), Hackathon.start_date.asc())
    
    hackathons = query.offset(skip).limit(limit).all()
    return [HackathonResponse.from_orm(h) for h in hackathons]

@router.get("/featured", response_model=List[HackathonResponse])
async def get_featured_hackathons(
    limit: int = Query(6, le=20),
    db: Session = Depends(get_db)
):
    """Get featured hackathons"""
    
    hackathons = db.query(Hackathon).filter(
        and_(
            Hackathon.is_featured == True,
            Hackathon.is_active == True,
            Hackathon.end_date > datetime.utcnow()
        )
    ).order_by(Hackathon.start_date.asc()).limit(limit).all()
    
    return [HackathonResponse.from_orm(h) for h in hackathons]

@router.get("/upcoming", response_model=List[HackathonResponse])
async def get_upcoming_hackathons(
    limit: int = Query(10, le=50),
    db: Session = Depends(get_db)
):
    """Get upcoming hackathons"""
    
    hackathons = db.query(Hackathon).filter(
        and_(
            Hackathon.is_active == True,
            Hackathon.start_date > datetime.utcnow()
        )
    ).order_by(Hackathon.start_date.asc()).limit(limit).all()
    
    return [HackathonResponse.from_orm(h) for h in hackathons]

@router.get("/{hackathon_id}", response_model=HackathonResponse)
async def get_hackathon(
    hackathon_id: int,
    db: Session = Depends(get_db)
):
    """Get specific hackathon by ID"""
    
    hackathon = db.query(Hackathon).filter(Hackathon.id == hackathon_id).first()
    if not hackathon:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Hackathon not found"
        )
    
    return HackathonResponse.from_orm(hackathon)

@router.post("/", response_model=HackathonResponse)
async def create_hackathon(
    hackathon_data: HackathonCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create new hackathon (admin only for now)"""
    
    hackathon = Hackathon(**hackathon_data.dict())
    db.add(hackathon)
    db.commit()
    db.refresh(hackathon)
    
    return HackathonResponse.from_orm(hackathon)
