# hackmates-backend/app/api/routes/teams.py
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import and_, or_
from typing import List, Optional
from app.database import get_db
from app.core.security import get_current_user
from app.models.user import User
from app.models.team import Team, TeamMember
from app.models.hackathon import Hackathon
from app.schemas.team import TeamCreate, TeamUpdate, TeamResponse, TeamMemberResponse
from app.crud.crud_team import team_crud

router = APIRouter()

@router.get("/", response_model=List[TeamResponse])
async def get_teams(
    hackathon_id: Optional[int] = Query(None),
    skip: int = Query(0, ge=0),
    limit: int = Query(20, le=50),
    search: Optional[str] = Query(None),
    looking_for_skills: Optional[str] = Query(None),
    db: Session = Depends(get_db)
):
    """Get teams with optional filters"""
    teams = team_crud.get_teams(
        db=db,
        hackathon_id=hackathon_id,
        skip=skip,
        limit=limit,
        search=search,
        looking_for_skills=looking_for_skills
    )
    return teams

@router.post("/", response_model=TeamResponse)
async def create_team(
    team_data: TeamCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create a new team"""
    # Check if hackathon exists
    hackathon = db.query(Hackathon).filter(Hackathon.id == team_data.hackathon_id).first()
    if not hackathon:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Hackathon not found"
        )
    
    # Check if user already has a team in this hackathon
    existing_team = team_crud.get_user_team_in_hackathon(db, current_user.id, team_data.hackathon_id) # type: ignore
    if existing_team:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You already have a team in this hackathon"
        )
    
    team = team_crud.create_team(db=db, team_data=team_data, leader_id=current_user.id) # type: ignore
    return team

@router.get("/{team_id}", response_model=TeamResponse)
async def get_team(
    team_id: int,
    db: Session = Depends(get_db)
):
    """Get team by ID"""
    team = team_crud.get_team_by_id(db=db, team_id=team_id)
    if not team:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Team not found"
        )
    return team

@router.put("/{team_id}", response_model=TeamResponse)
async def update_team(
    team_id: int,
    team_update: TeamUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update team (only team leader can update)"""
    team = team_crud.get_team_by_id(db=db, team_id=team_id)
    if not team:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Team not found"
        )
    
    # Check if current user is team leader
    if not team_crud.is_team_leader(db=db, team_id=team_id, user_id=current_user.id):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only team leader can update team"
        )
    
    updated_team = team_crud.update_team(db=db, team_id=team_id, team_update=team_update)
    return updated_team

@router.delete("/{team_id}")
async def delete_team(
    team_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Delete team (only team leader can delete)"""
    team = team_crud.get_team_by_id(db=db, team_id=team_id)
    if not team:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Team not found"
        )
    
    # Check if current user is team leader
    if not team_crud.is_team_leader(db=db, team_id=team_id, user_id=current_user.id):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only team leader can delete team"
        )
    
    team_crud.delete_team(db=db, team_id=team_id)
    return {"message": "Team deleted successfully"}

@router.post("/{team_id}/join")
async def join_team(
    team_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Join a team"""
    team = team_crud.get_team_by_id(db=db, team_id=team_id)
    if not team:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Team not found"
        )
    
    # Check if team is full
    if team.current_members >= team.max_members:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Team is full"
        )
    
    # Check if user already in team
    if team_crud.is_user_in_team(db=db, team_id=team_id, user_id=current_user.id):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You are already in this team"
        )
    
    # Check if user already has a team in this hackathon
    existing_team = team_crud.get_user_team_in_hackathon(db, current_user.id, team.hackathon_id)
    if existing_team:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You already have a team in this hackathon"
        )
    
    team_crud.add_member_to_team(db=db, team_id=team_id, user_id=current_user.id)
    return {"message": "Successfully joined team"}

@router.post("/{team_id}/leave")
async def leave_team(
    team_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Leave a team"""
    team = team_crud.get_team_by_id(db=db, team_id=team_id)
    if not team:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Team not found"
        )
    
    # Check if user is in team
    if not team_crud.is_user_in_team(db=db, team_id=team_id, user_id=current_user.id):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You are not in this team"
        )
    
    # Check if user is team leader
    if team_crud.is_team_leader(db=db, team_id=team_id, user_id=current_user.id):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Team leader cannot leave team. Transfer leadership or delete team."
        )
    
    team_crud.remove_member_from_team(db=db, team_id=team_id, user_id=current_user.id)
    return {"message": "Successfully left team"}

@router.get("/{team_id}/members", response_model=List[TeamMemberResponse])
async def get_team_members(
    team_id: int,
    db: Session = Depends(get_db)
):
    """Get team members"""
    team = team_crud.get_team_by_id(db=db, team_id=team_id)
    if not team:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Team not found"
        )
    return team.members

@router.post("/{team_id}/transfer-leadership")
async def transfer_leadership(
    team_id: int,
    new_leader_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Transfer team leadership"""
    team = team_crud.get_team_by_id(db=db, team_id=team_id)
    if not team:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Team not found"
        )
    
    # Check if current user is team leader
    if not team_crud.is_team_leader(db=db, team_id=team_id, user_id=current_user.id):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only team leader can transfer leadership"
        )
    
    # Check if new leader is in team
    if not team_crud.is_user_in_team(db=db, team_id=team_id, user_id=new_leader_id):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="New leader must be a team member"
        )
    
    team_crud.transfer_leadership(db=db, team_id=team_id, new_leader_id=new_leader_id)
    return {"message": "Leadership transferred successfully"}