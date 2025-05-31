# hackmates-backend/app/crud/crud_hackathon.py
from sqlalchemy.orm import Session
from sqlalchemy import and_, or_, func
from typing import List, Optional
from datetime import datetime, date
from app.models.hackathon import Hackathon
from app.schemas.hackathon import HackathonCreate

class HackathonCRUD:
    def create_hackathon(self, db: Session, hackathon_data: HackathonCreate) -> Hackathon:
        """Create a new hackathon"""
        db_hackathon = Hackathon(
            title=hackathon_data.title,
            description=hackathon_data.description,
            organizer=hackathon_data.organizer,
            start_date=hackathon_data.start_date,
            end_date=hackathon_data.end_date,
            registration_deadline=hackathon_data.registration_deadline,
            location=hackathon_data.location,
            is_virtual=hackathon_data.is_virtual,
            website_url=hackathon_data.website_url,
            prize_pool=hackathon_data.prize_pool,
            max_team_size=hackathon_data.max_team_size,
            min_team_size=hackathon_data.min_team_size,
            themes=hackathon_data.themes,
            skills_required=hackathon_data.skills_required,
            eligibility=hackathon_data.eligibility,
            rules=hackathon_data.rules,
            is_active=hackathon_data.is_active
        )
        db.add(db_hackathon)
        db.commit()
        db.refresh(db_hackathon)
        return db_hackathon
    
    def get_hackathon_by_id(self, db: Session, hackathon_id: int) -> Optional[Hackathon]:
        """Get hackathon by ID"""
        return db.query(Hackathon).filter(Hackathon.id == hackathon_id).first()
    
    def get_hackathons(
        self,
        db: Session,
        skip: int = 0,
        limit: int = 20,
        search: Optional[str] = None,
        location: Optional[str] = None,
        is_virtual: Optional[bool] = None,
        status: Optional[str] = None,
        themes: Optional[str] = None,
        min_prize: Optional[int] = None
    ) -> List[Hackathon]:
        """Get hackathons with filters"""
        query = db.query(Hackathon).filter(Hackathon.is_active == True)
        
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
        
        if is_virtual is not None:
            query = query.filter(Hackathon.is_virtual == is_virtual)
        
        if themes:
            theme_list = [theme.strip().lower() for theme in themes.split(",")]
            for theme in theme_list:
                query = query.filter(
                    func.array_to_string(Hackathon.themes, ',').ilike(f"%{theme}%")
                )
        
        if min_prize:
            query = query.filter(Hackathon.prize_pool >= min_prize)
        
        # Filter by status
        today = date.today()
        if status == "upcoming":
            query = query.filter(Hackathon.start_date > today)
        elif status == "ongoing":
            query = query.filter(
                and_(
                    Hackathon.start_date <= today,
                    Hackathon.end_date >= today
                )
            )
        elif status == "past":
            query = query.filter(Hackathon.end_date < today)
        elif status == "registration_open":
            query = query.filter(
                and_(
                    Hackathon.registration_deadline >= today,
                    Hackathon.start_date > today
                )
            )
        
        return query.order_by(Hackathon.start_date.asc()).offset(skip).limit(limit).all()
    
    def update_hackathon(self, db: Session, hackathon_id: int, hackathon_update: HackathonUpdate) -> Optional[Hackathon]:
        """Update hackathon details"""
        db_hackathon = db.query(Hackathon).filter(Hackathon.id == hackathon_id).first()
        if not db_hackathon:
            return None
        
        update_data = hackathon_update.dict(exclude_unset=True)
        for field, value in update_data.items():
            setattr(db_hackathon, field, value)
        
        db.commit()
        db.refresh(db_hackathon)
        return db_hackathon
    
    def delete_hackathon(self, db: Session, hackathon_id: int) -> bool:
        """Delete hackathon"""
        db_hackathon = db.query(Hackathon).filter(Hackathon.id == hackathon_id).first()
        if db_hackathon:
            db.delete(db_hackathon)
            db.commit()
            return True
        return False
    
    def get_trending_hackathons(self, db: Session, limit: int = 10) -> List[Hackathon]:
        """Get trending hackathons (with most registrations/teams)"""
        today = date.today()
        return db.query(Hackathon).filter(
            and_(
                Hackathon.is_active == True,
                Hackathon.registration_deadline >= today,
                Hackathon.start_date > today
            )
        ).order_by(
            Hackathon.registered_teams.desc(),
            Hackathon.prize_pool.desc()
        ).limit(limit).all()
    
    def get_hackathons_by_organizer(self, db: Session, organizer: str) -> List[Hackathon]:
        """Get hackathons by organizer"""
        return db.query(Hackathon).filter(
            Hackathon.organizer.ilike(f"%{organizer}%")
        ).order_by(Hackathon.start_date.desc()).all()
    
    def get_upcoming_deadlines(self, db: Session, days: int = 7) -> List[Hackathon]:
        """Get hackathons with registration deadlines in next N days"""
        from datetime import timedelta
        deadline_date = date.today() + timedelta(days=days)
        
        return db.query(Hackathon).filter(
            and_(
                Hackathon.is_active == True,
                Hackathon.registration_deadline >= date.today(),
                Hackathon.registration_deadline <= deadline_date
            )
        ).order_by(Hackathon.registration_deadline.asc()).all()

hackathon_crud = HackathonCRUD()