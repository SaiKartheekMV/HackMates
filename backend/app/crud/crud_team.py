# hackmates-backend/app/crud/crud_team.py
from sqlalchemy.orm import Session
from sqlalchemy import and_, or_, func
from typing import List, Optional
from app.models.team import Team, TeamMember
from app.models.user import User
from app.schemas.team import TeamCreate, TeamUpdate

class TeamCRUD:
    def create_team(self, db: Session, team_data: TeamCreate, leader_id: int) -> Team:
        """Create a new team with leader"""
        db_team = Team(
            name=team_data.name,
            description=team_data.description,
            hackathon_id=team_data.hackathon_id,
            max_members=team_data.max_members,
            required_skills=team_data.required_skills,
            looking_for_roles=team_data.looking_for_roles,
            project_idea=team_data.project_idea,
            tech_stack=team_data.tech_stack,
            is_public=team_data.is_public,
            current_members=1,
            status="recruiting"
        )
        db.add(db_team)
        db.commit()
        db.refresh(db_team)
        
        # Add leader as team member
        leader_member = TeamMember(
            team_id=db_team.id,
            user_id=leader_id,
            is_leader=True,
            role="Team Leader"
        )
        db.add(leader_member)
        db.commit()
        
        return self.get_team_by_id(db, db_team.id)
    
    def get_team_by_id(self, db: Session, team_id: int) -> Optional[Team]:
        """Get team by ID with members"""
        return db.query(Team).filter(Team.id == team_id).first()
    
    def get_teams(
        self,
        db: Session,
        hackathon_id: Optional[int] = None,
        skip: int = 0,
        limit: int = 20,
        search: Optional[str] = None,
        looking_for_skills: Optional[str] = None
    ) -> List[Team]:
        """Get teams with filters"""
        query = db.query(Team).filter(Team.is_public == True)
        
        if hackathon_id:
            query = query.filter(Team.hackathon_id == hackathon_id)
        
        if search:
            query = query.filter(
                or_(
                    Team.name.ilike(f"%{search}%"),
                    Team.description.ilike(f"%{search}%"),
                    Team.project_idea.ilike(f"%{search}%")
                )
            )
        
        if looking_for_skills:
            skills = [skill.strip().lower() for skill in looking_for_skills.split(",")]
            for skill in skills:
                query = query.filter(
                    or_(
                        func.array_to_string(Team.required_skills, ',').ilike(f"%{skill}%"),
                        func.array_to_string(Team.looking_for_roles, ',').ilike(f"%{skill}%")
                    )
                )
        
        return query.offset(skip).limit(limit).all()
    
    def update_team(self, db: Session, team_id: int, team_update: TeamUpdate) -> Team:
        """Update team details"""
        db_team = db.query(Team).filter(Team.id == team_id).first()
        if not db_team:
            return None
        
        update_data = team_update.dict(exclude_unset=True)
        for field, value in update_data.items():
            setattr(db_team, field, value)
        
        db.commit()
        db.refresh(db_team)
        return db_team
    
    def delete_team(self, db: Session, team_id: int) -> bool:
        """Delete team and all members"""
        # Delete all team members first
        db.query(TeamMember).filter(TeamMember.team_id == team_id).delete()
        # Delete team
        db_team = db.query(Team).filter(Team.id == team_id).first()
        if db_team:
            db.delete(db_team)
            db.commit()
            return True
        return False
    
    def add_member_to_team(self, db: Session, team_id: int, user_id: int, role: Optional[str] = None) -> TeamMember:
        """Add member to team"""
        member = TeamMember(
            team_id=team_id,
            user_id=user_id,
            role=role or "Member",
            is_leader=False
        )
        db.add(member)
        
        # Update team member count
        team = db.query(Team).filter(Team.id == team_id).first()
        team.current_members += 1
        
        # Update team status if full
        if team.current_members >= team.max_members:
            team.status = "full"
        
        db.commit()
        return member
    
    def remove_member_from_team(self, db: Session, team_id: int, user_id: int) -> bool:
        """Remove member from team"""
        member = db.query(TeamMember).filter(
            and_(TeamMember.team_id == team_id, TeamMember.user_id == user_id)
        ).first()
        
        if member:
            db.delete(member)
            
            # Update team member count
            team = db.query(Team).filter(Team.id == team_id).first()
            team.current_members -= 1
            
            # Update team status
            if team.status == "full":
                team.status = "recruiting"
            
            db.commit()
            return True
        return False
    
    def is_user_in_team(self, db: Session, team_id: int, user_id: int) -> bool:
        """Check if user is in team"""
        member = db.query(TeamMember).filter(
            and_(TeamMember.team_id == team_id, TeamMember.user_id == user_id)
        ).first()
        return member is not None
    
    def is_team_leader(self, db: Session, team_id: int, user_id: int) -> bool:
        """Check if user is team leader"""
        member = db.query(TeamMember).filter(
            and_(
                TeamMember.team_id == team_id,
                TeamMember.user_id == user_id,
                TeamMember.is_leader == True
            )
        ).first()
        return member is not None
    
    def get_user_team_in_hackathon(self, db: Session, user_id: int, hackathon_id: int) -> Optional[Team]:
        """Get user's team in a specific hackathon"""
        return db.query(Team).join(TeamMember).filter(
            and_(
                TeamMember.user_id == user_id,
                Team.hackathon_id == hackathon_id
            )
        ).first()
    
    def get_user_teams(self, db: Session, user_id: int) -> List[Team]:
        """Get all teams user is part of"""
        return db.query(Team).join(TeamMember).filter(TeamMember.user_id == user_id).all()
    
    def transfer_leadership(self, db: Session, team_id: int, new_leader_id: int) -> bool:
        """Transfer team leadership"""
        # Remove leadership from current leader
        db.query(TeamMember).filter(
            and_(TeamMember.team_id == team_id, TeamMember.is_leader == True)
        ).update({"is_leader": False, "role": "Member"})
        
        # Make new leader
        db.query(TeamMember).filter(
            and_(TeamMember.team_id == team_id, TeamMember.user_id == new_leader_id)
        ).update({"is_leader": True, "role": "Team Leader"})
        
        db.commit()
        return True

team_crud = TeamCRUD()