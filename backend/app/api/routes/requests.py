    # hackmates-backend/app/api/routes/requests.py
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import and_, or_, desc
from typing import List, Optional
from datetime import datetime

from app.database import get_db
from app.core.security import get_current_user
from app.models.user import User
from app.models.team import Team
from app.models.hackathon import Hackathon
from app.models.hack_request import HackRequest
from app.schemas.request import (
    HackRequestCreate, 
    HackRequestResponse,
    HackRequestStatus
)

router = APIRouter()

@router.post("/send", response_model=HackRequestResponse)
async def send_hack_request(
    request_data: HackRequestCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Send a hack request to another user"""
    
    # Check if recipient exists
    recipient = db.query(User).filter(User.id == request_data.recipient_id).first()
    if not recipient:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Recipient not found"
        )
    
    # Check if user is trying to send request to themselves
    if current_user.id == request_data.recipient_id: # type: ignore
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot send hack request to yourself"
        )
    
    # Check if hackathon exists (if specified)
    if request_data.hackathon_id:
        hackathon = db.query(Hackathon).filter(Hackathon.id == request_data.hackathon_id).first()
        if not hackathon:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Hackathon not found"
            )
    
    # Check if request already exists
    existing_request = db.query(HackRequest).filter(
        and_(
            HackRequest.sender_id == current_user.id,
            HackRequest.recipient_id == request_data.recipient_id,
            HackRequest.hackathon_id == request_data.hackathon_id,
            HackRequest.status.in_([HackRequestStatus.PENDING, HackRequestStatus.ACCEPTED])
        )
    ).first()
    
    if existing_request:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Request already exists or is already accepted"
        )
    
    # Create new hack request
    new_request = HackRequest(
        sender_id=current_user.id,
        recipient_id=request_data.recipient_id,
        hackathon_id=request_data.hackathon_id,
        team_id=request_data.team_id,
        message=request_data.message,
        status=HackRequestStatus.PENDING,
        created_at=datetime.utcnow()
    )
    
    db.add(new_request)
    db.commit()
    db.refresh(new_request)
    
    return new_request

@router.get("/sent", response_model=List[HackRequestResponse])
async def get_sent_requests(
    skip: int = Query(0, ge=0),
    limit: int = Query(20, le=50),
    status_filter: Optional[HackRequestStatus] = Query(None),
    hackathon_id: Optional[int] = Query(None),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get hack requests sent by current user"""
    
    query = db.query(HackRequest).filter(HackRequest.sender_id == current_user.id)
    
    if status_filter:
        query = query.filter(HackRequest.status == status_filter)
    
    if hackathon_id:
        query = query.filter(HackRequest.hackathon_id == hackathon_id)
    
    requests = query.order_by(desc(HackRequest.created_at)).offset(skip).limit(limit).all()
    return requests

@router.get("/received", response_model=List[HackRequestResponse])
async def get_received_requests(
    skip: int = Query(0, ge=0),
    limit: int = Query(20, le=50),
    status_filter: Optional[HackRequestStatus] = Query(None),
    hackathon_id: Optional[int] = Query(None),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get hack requests received by current user"""
    
    query = db.query(HackRequest).filter(HackRequest.recipient_id == current_user.id)
    
    if status_filter:
        query = query.filter(HackRequest.status == status_filter)
    
    if hackathon_id:
        query = query.filter(HackRequest.hackathon_id == hackathon_id)
    
    requests = query.order_by(desc(HackRequest.created_at)).offset(skip).limit(limit).all()
    return requests

@router.put("/{request_id}/accept", response_model=HackRequestResponse)
async def accept_hack_request(
    request_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Accept a hack request"""
    
    # Get the request
    hack_request = db.query(HackRequest).filter(
        and_(
            HackRequest.id == request_id,
            HackRequest.recipient_id == current_user.id,
            HackRequest.status == HackRequestStatus.PENDING
        )
    ).first()
    
    if not hack_request:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Hack request not found or already processed"
        )
    
    # Update request status
    hack_request.status = HackRequestStatus.ACCEPTED
    hack_request.updated_at = datetime.utcnow() # type: ignore
    
    # If there's a team associated, add both users to the team
    if hack_request.team_id: # type: ignore
        # Check if team exists and has space
        team = db.query(Team).filter(Team.id == hack_request.team_id).first()
        if team and len(team.members) < team.max_members: # type: ignore
            # Add recipient to team if not already a member
            existing_member = db.query(TeamMember).filter(
                and_(
                    TeamMember.team_id == team.id,
                    TeamMember.user_id == current_user.id
                )
            ).first()
            
            if not existing_member:
                new_member = TeamMember(
                    team_id=team.id,
                    user_id=current_user.id,
                    role="member",
                    joined_at=datetime.utcnow()
                )
                db.add(new_member)
    
    db.commit()
    db.refresh(hack_request)
    
    return hack_request

@router.put("/{request_id}/reject", response_model=HackRequestResponse)
async def reject_hack_request(
    request_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Reject a hack request"""
    
    # Get the request
    hack_request = db.query(HackRequest).filter(
        and_(
            HackRequest.id == request_id,
            HackRequest.recipient_id == current_user.id,
            HackRequest.status == HackRequestStatus.PENDING
        )
    ).first()
    
    if not hack_request:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Hack request not found or already processed"
        )
    
    # Update request status
    hack_request.status = HackRequestStatus.REJECTED
    hack_request.updated_at = datetime.utcnow()
    
    db.commit()
    db.refresh(hack_request)
    
    return hack_request

@router.delete("/{request_id}")
async def cancel_hack_request(
    request_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Cancel/delete a hack request (only sender can cancel)"""
    
    hack_request = db.query(HackRequest).filter(
        and_(
            HackRequest.id == request_id,
            HackRequest.sender_id == current_user.id,
            HackRequest.status == HackRequestStatus.PENDING
        )
    ).first()
    
    if not hack_request:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Hack request not found or cannot be cancelled"
        )
    
    db.delete(hack_request)
    db.commit()
    
    return {"message": "Hack request cancelled successfully"}

@router.get("/{request_id}", response_model=HackRequestResponse)
async def get_hack_request(
    request_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get a specific hack request details"""
    
    hack_request = db.query(HackRequest).filter(
        and_(
            HackRequest.id == request_id,
            or_(
                HackRequest.sender_id == current_user.id,
                HackRequest.recipient_id == current_user.id
            )
        )
    ).first()
    
    if not hack_request:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Hack request not found"
        )
    
    return hack_request

@router.get("/stats/summary")
async def get_request_stats(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get summary statistics of hack requests for current user"""
    
    # Count sent requests by status
    sent_pending = db.query(HackRequest).filter(
        and_(
            HackRequest.sender_id == current_user.id,
            HackRequest.status == HackRequestStatus.PENDING
        )
    ).count()
    
    sent_accepted = db.query(HackRequest).filter(
        and_(
            HackRequest.sender_id == current_user.id,
            HackRequest.status == HackRequestStatus.ACCEPTED
        )
    ).count()
    
    sent_rejected = db.query(HackRequest).filter(
        and_(
            HackRequest.sender_id == current_user.id,
            HackRequest.status == HackRequestStatus.REJECTED
        )
    ).count()
    
    # Count received requests by status
    received_pending = db.query(HackRequest).filter(
        and_(
            HackRequest.recipient_id == current_user.id,
            HackRequest.status == HackRequestStatus.PENDING
        )
    ).count()
    
    received_accepted = db.query(HackRequest).filter(
        and_(
            HackRequest.recipient_id == current_user.id,
            HackRequest.status == HackRequestStatus.ACCEPTED
        )
    ).count()
    
    received_rejected = db.query(HackRequest).filter(
        and_(
            HackRequest.recipient_id == current_user.id,
            HackRequest.status == HackRequestStatus.REJECTED
        )
    ).count()
    
    return {
        "sent": {
            "pending": sent_pending,
            "accepted": sent_accepted,
            "rejected": sent_rejected,
            "total": sent_pending + sent_accepted + sent_rejected
        },
        "received": {
            "pending": received_pending,
            "accepted": received_accepted,
            "rejected": received_rejected,
            "total": received_pending + received_accepted + received_rejected
        }
    }