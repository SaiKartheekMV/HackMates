# hackmates-backend/app/crud/crud_request.py
from sqlalchemy.orm import Session
from sqlalchemy import and_, or_
from typing import List, Optional
from datetime import datetime, timedelta
from app.models.request import HackRequest
from app.schemas.request import HackRequestCreate

class RequestCRUD:
    def create_request(self, db: Session, request_data: HackRequestCreate, sender_id: int) -> HackRequest:
        """Create a new hack request"""
        # Set expiration time (7 days from now)
        expires_at = datetime.utcnow() + timedelta(days=7)
        
        db_request = HackRequest(
            sender_id=sender_id,
            receiver_id=request_data.receiver_id,
            message=request_data.message,
            request_type=request_data.request_type,
            hackathon_id=request_data.hackathon_id,
            team_id=request_data.team_id,
            status="pending",
            expires_at=expires_at
        )
        db.add(db_request)
        db.commit()
        db.refresh(db_request)
        return db_request
    
    def get_request_by_id(self, db: Session, request_id: int) -> Optional[HackRequest]:
        """Get request by ID"""
        return db.query(HackRequest).filter(HackRequest.id == request_id).first()
    
    def get_user_received_requests(
        self,
        db: Session,
        user_id: int,
        status: Optional[str] = None,
        skip: int = 0,
        limit: int = 20
    ) -> List[HackRequest]:
        """Get requests received by user"""
        query = db.query(HackRequest).filter(HackRequest.receiver_id == user_id)
        
        if status:
            query = query.filter(HackRequest.status == status)
        else:
            # Only show active requests by default
            query = query.filter(HackRequest.status.in_(["pending", "accepted"]))
        
        return query.order_by(HackRequest.created_at.desc()).offset(skip).limit(limit).all()
    
    def get_user_sent_requests(
        self,
        db: Session,
        user_id: int,
        status: Optional[str] = None,
        skip: int = 0,
        limit: int = 20
    ) -> List[HackRequest]:
        """Get requests sent by user"""
        query = db.query(HackRequest).filter(HackRequest.sender_id == user_id)
        
        if status:
            query = query.filter(HackRequest.status == status)
        
        return query.order_by(HackRequest.created_at.desc()).offset(skip).limit(limit).all()
    
    def update_request_status(
        self,
        db: Session,
        request_id: int,
        status: str,
        user_id: int
    ) -> Optional[HackRequest]:
        """Update request status (accept/reject)"""
        db_request = db.query(HackRequest).filter(
            and_(
                HackRequest.id == request_id,
                HackRequest.receiver_id == user_id,
                HackRequest.status == "pending"
            )
        ).first()
        
        if not db_request:
            return None
        
        db_request.status = status
        db_request.responded_at = datetime.utcnow()
        
        db.commit()
        db.refresh(db_request)
        return db_request
    
    def check_existing_request(
        self,
        db: Session,
        sender_id: int,
        receiver_id: int,
        request_type: str,
        hackathon_id: Optional[int] = None,
        team_id: Optional[int] = None
    ) -> Optional[HackRequest]:
        """Check if similar request already exists"""
        query = db.query(HackRequest).filter(
            and_(
                HackRequest.sender_id == sender_id,
                HackRequest.receiver_id == receiver_id,
                HackRequest.request_type == request_type,
                HackRequest.status == "pending"
            )
        )
        
        if hackathon_id:
            query = query.filter(HackRequest.hackathon_id == hackathon_id)
        
        if team_id:
            query = query.filter(HackRequest.team_id == team_id)
        
        return query.first()
    
    def get_hackathon_requests(
        self,
        db: Session,
        hackathon_id: int,
        request_type: Optional[str] = None,
        skip: int = 0,
        limit: int = 50
    ) -> List[HackRequest]:
        """Get all requests for a specific hackathon"""
        query = db.query(HackRequest).filter(HackRequest.hackathon_id == hackathon_id)
        
        if request_type:
            query = query.filter(HackRequest.request_type == request_type)
        
        return query.order_by(HackRequest.created_at.desc()).offset(skip).limit(limit).all()
    
    def get_team_requests(
        self,
        db: Session,
        team_id: int,
        request_type: Optional[str] = None,
        skip: int = 0,
        limit: int = 20
    ) -> List[HackRequest]:
        """Get all requests for a specific team"""
        query = db.query(HackRequest).filter(HackRequest.team_id == team_id)
        
        if request_type:
            query = query.filter(HackRequest.request_type == request_type)
        
        return query.order_by(HackRequest.created_at.desc()).offset(skip).limit(limit).all()
    
    def delete_request(self, db: Session, request_id: int, user_id: int) -> bool:
        """Delete a request (only sender can delete)"""
        db_request = db.query(HackRequest).filter(
            and_(
                HackRequest.id == request_id,
                HackRequest.sender_id == user_id
            )
        ).first()
        
        if not db_request:
            return False
        
        db.delete(db_request)
        db.commit()
        return True
    
    def cancel_request(self, db: Session, request_id: int, user_id: int) -> Optional[HackRequest]:
        """Cancel a pending request"""
        db_request = db.query(HackRequest).filter(
            and_(
                HackRequest.id == request_id,
                HackRequest.sender_id == user_id,
                HackRequest.status == "pending"
            )
        ).first()
        
        if not db_request:
            return None
        
        db_request.status = "cancelled"
        db_request.responded_at = datetime.utcnow()
        
        db.commit()
        db.refresh(db_request)
        return db_request
    
    def get_expired_requests(self, db: Session) -> List[HackRequest]:
        """Get all expired pending requests"""
        current_time = datetime.utcnow()
        return db.query(HackRequest).filter(
            and_(
                HackRequest.status == "pending",
                HackRequest.expires_at < current_time
            )
        ).all()
    
    def expire_old_requests(self, db: Session) -> int:
        """Mark expired requests as expired and return count"""
        expired_requests = self.get_expired_requests(db)
        count = len(expired_requests)
        
        for request in expired_requests:
            request.status = "expired"
            request.responded_at = datetime.utcnow()
        
        if count > 0:
            db.commit()
        
        return count
    
    def get_request_statistics(self, db: Session, user_id: int) -> dict:
        """Get request statistics for a user"""
        # Sent requests stats
        sent_total = db.query(HackRequest).filter(HackRequest.sender_id == user_id).count()
        sent_pending = db.query(HackRequest).filter(
            and_(HackRequest.sender_id == user_id, HackRequest.status == "pending")
        ).count()
        sent_accepted = db.query(HackRequest).filter(
            and_(HackRequest.sender_id == user_id, HackRequest.status == "accepted")
        ).count()
        sent_rejected = db.query(HackRequest).filter(
            and_(HackRequest.sender_id == user_id, HackRequest.status == "rejected")
        ).count()
        
        # Received requests stats
        received_total = db.query(HackRequest).filter(HackRequest.receiver_id == user_id).count()
        received_pending = db.query(HackRequest).filter(
            and_(HackRequest.receiver_id == user_id, HackRequest.status == "pending")
        ).count()
        received_accepted = db.query(HackRequest).filter(
            and_(HackRequest.receiver_id == user_id, HackRequest.status == "accepted")
        ).count()
        received_rejected = db.query(HackRequest).filter(
            and_(HackRequest.receiver_id == user_id, HackRequest.status == "rejected")
        ).count()
        
        return {
            "sent": {
                "total": sent_total,
                "pending": sent_pending,
                "accepted": sent_accepted,
                "rejected": sent_rejected
            },
            "received": {
                "total": received_total,
                "pending": received_pending,
                "accepted": received_accepted,
                "rejected": received_rejected
            }
        }
    
    def get_mutual_requests(
        self,
        db: Session,
        user1_id: int,
        user2_id: int
    ) -> List[HackRequest]:
        """Get all requests between two users"""
        return db.query(HackRequest).filter(
            or_(
                and_(HackRequest.sender_id == user1_id, HackRequest.receiver_id == user2_id),
                and_(HackRequest.sender_id == user2_id, HackRequest.receiver_id == user1_id)
            )
        ).order_by(HackRequest.created_at.desc()).all()
    
    def bulk_update_status(
        self,
        db: Session,
        request_ids: List[int],
        status: str,
        user_id: int
    ) -> int:
        """Bulk update multiple requests status"""
        updated_count = db.query(HackRequest).filter(
            and_(
                HackRequest.id.in_(request_ids),
                HackRequest.receiver_id == user_id,
                HackRequest.status == "pending"
            )
        ).update(
            {
                "status": status,
                "responded_at": datetime.utcnow()
            },
            synchronize_session=False
        )
        
        db.commit()
        return updated_count
    
    def get_requests_by_type(
        self,
        db: Session,
        request_type: str,
        user_id: Optional[int] = None,
        skip: int = 0,
        limit: int = 50
    ) -> List[HackRequest]:
        """Get requests by type, optionally filtered by user"""
        query = db.query(HackRequest).filter(HackRequest.request_type == request_type)
        
        if user_id:
            query = query.filter(
                or_(
                    HackRequest.sender_id == user_id,
                    HackRequest.receiver_id == user_id
                )
            )
        
        return query.order_by(HackRequest.created_at.desc()).offset(skip).limit(limit).all()

# Create instance
request_crud = RequestCRUD()