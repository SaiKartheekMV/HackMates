from sqlalchemy.orm import Session
from sqlalchemy import and_, or_, func, desc
from typing import List, Optional, Dict, Any
from app.models.user import User
from app.models.profile import Profile
from app.schemas.user import UserCreate, UserUpdate
from app.core.security import get_password_hash, verify_password
from datetime import datetime, timedelta

class UserCRUD:
    def create_user(self, db: Session, user_data: UserCreate) -> User:
        """Create a new user"""
        hashed_password = get_password_hash(user_data.password)
        db_user = User(
            email=user_data.email,
            username=user_data.username,
            first_name=user_data.first_name,
            last_name=user_data.last_name,
            hashed_password=hashed_password,
            is_active=True,
            is_verified=False,
            created_at=datetime.utcnow()
        )
        db.add(db_user)
        db.commit()
        db.refresh(db_user)
        return db_user

    def get_user_by_id(self, db: Session, user_id: int) -> Optional[User]:
        """Get user by ID"""
        return db.query(User).filter(User.id == user_id).first()

    def get_user_by_email(self, db: Session, email: str) -> Optional[User]:
        """Get user by email"""
        return db.query(User).filter(User.email == email).first()

    def get_user_by_username(self, db: Session, username: str) -> Optional[User]:
        """Get user by username"""
        return db.query(User).filter(User.username == username).first()

    def get_user_with_profile(self, db: Session, user_id: int) -> Optional[User]:
        """Get user with profile data"""
        return db.query(User).filter(User.id == user_id).join(Profile, isouter=True).first()

    def authenticate_user(self, db: Session, email: str, password: str) -> Optional[User]:
        """Authenticate user with email and password"""
        user = self.get_user_by_email(db, email)
        if not user:
            return None
        if not verify_password(password, user.hashed_password):
            return None
        return user

    def update_user(self, db: Session, user_id: int, user_data: UserUpdate) -> Optional[User]:
        """Update user information"""
        db_user = db.query(User).filter(User.id == user_id).first()
        if not db_user:
            return None
        
        update_data = user_data.dict(exclude_unset=True)
        
        # Hash password if it's being updated
        if "password" in update_data:
            update_data["hashed_password"] = get_password_hash(update_data.pop("password"))
        
        for field, value in update_data.items():
            setattr(db_user, field, value)
        
        db_user.updated_at = datetime.utcnow()
        db.commit()
        db.refresh(db_user)
        return db_user

    def delete_user(self, db: Session, user_id: int) -> bool:
        """Delete user (soft delete by setting is_active to False)"""
        db_user = db.query(User).filter(User.id == user_id).first()
        if not db_user:
            return False
        
        db_user.is_active = False
        db_user.updated_at = datetime.utcnow()
        db.commit()
        return True

    def hard_delete_user(self, db: Session, user_id: int) -> bool:
        """Hard delete user (completely remove from database)"""
        db_user = db.query(User).filter(User.id == user_id).first()
        if not db_user:
            return False
        
        db.delete(db_user)
        db.commit()
        return True

    def get_users(self, db: Session, skip: int = 0, limit: int = 100, include_inactive: bool = False) -> List[User]:
        """Get list of users with pagination"""
        query = db.query(User)
        
        if not include_inactive:
            query = query.filter(User.is_active == True)
        
        return query.offset(skip).limit(limit).all()

    def search_users(self, db: Session, 
                    search_term: str, 
                    skip: int = 0, 
                    limit: int = 20) -> List[User]:
        """Search users by name, username, or email"""
        search_pattern = f"%{search_term}%"
        
        return db.query(User).filter(
            and_(
                User.is_active == True,
                or_(
                    User.first_name.ilike(search_pattern),
                    User.last_name.ilike(search_pattern),
                    User.username.ilike(search_pattern),
                    User.email.ilike(search_pattern),
                    func.concat(User.first_name, ' ', User.last_name).ilike(search_pattern)
                )
            )
        ).offset(skip).limit(limit).all()

    def verify_user_email(self, db: Session, user_id: int) -> Optional[User]:
        """Mark user email as verified"""
        db_user = db.query(User).filter(User.id == user_id).first()
        if not db_user:
            return None
        
        db_user.is_verified = True
        db_user.email_verified_at = datetime.utcnow()
        db_user.updated_at = datetime.utcnow()
        db.commit()
        db.refresh(db_user)
        return db_user

    def activate_user(self, db: Session, user_id: int) -> Optional[User]:
        """Activate user account"""
        db_user = db.query(User).filter(User.id == user_id).first()
        if not db_user:
            return None
        
        db_user.is_active = True
        db_user.updated_at = datetime.utcnow()
        db.commit()
        db.refresh(db_user)
        return db_user

    def deactivate_user(self, db: Session, user_id: int) -> Optional[User]:
        """Deactivate user account"""
        db_user = db.query(User).filter(User.id == user_id).first()
        if not db_user:
            return None
        
        db_user.is_active = False
        db_user.updated_at = datetime.utcnow()
        db.commit()
        db.refresh(db_user)
        return db_user

    def update_last_login(self, db: Session, user_id: int) -> Optional[User]:
        """Update user's last login timestamp"""
        db_user = db.query(User).filter(User.id == user_id).first()
        if not db_user:
            return None
        
        db_user.last_login_at = datetime.utcnow()
        db.commit()
        db.refresh(db_user)
        return db_user

    def change_password(self, db: Session, user_id: int, old_password: str, new_password: str) -> Dict[str, Any]:
        """Change user password with verification"""
        db_user = db.query(User).filter(User.id == user_id).first()
        if not db_user:
            return {"success": False, "message": "User not found"}
        
        # Verify old password
        if not verify_password(old_password, db_user.hashed_password):
            return {"success": False, "message": "Invalid current password"}
        
        # Update password
        db_user.hashed_password = get_password_hash(new_password)
        db_user.updated_at = datetime.utcnow()
        db.commit()
        
        return {"success": True, "message": "Password updated successfully"}

    def reset_password(self, db: Session, user_id: int, new_password: str) -> Optional[User]:
        """Reset user password (admin function)"""
        db_user = db.query(User).filter(User.id == user_id).first()
        if not db_user:
            return None
        
        db_user.hashed_password = get_password_hash(new_password)
        db_user.updated_at = datetime.utcnow()
        db.commit()
        db.refresh(db_user)
        return db_user

    def get_user_stats(self, db: Session, user_id: int) -> Dict[str, Any]:
        """Get user statistics"""
        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            return {}
        
        # Calculate days since joining
        days_since_joining = (datetime.utcnow() - user.created_at).days
        
        # Get profile completion (if profile exists)
        profile = db.query(Profile).filter(Profile.user_id == user_id).first()
        profile_completion = 0
        hackathons_attended = 0
        
        if profile:
            # Calculate profile completion
            total_fields = 10  # Adjust based on profile fields
            completed_fields = sum([
                bool(profile.bio),
                bool(profile.location),
                bool(profile.skills),
                bool(profile.experience_level),
                bool(profile.interests),
                bool(profile.github_url),
                bool(profile.linkedin_url),
                bool(profile.resume_url),
                bool(profile.preferred_roles),
                bool(profile.timezone)
            ])
            profile_completion = int((completed_fields / total_fields) * 100)
            hackathons_attended = profile.hackathons_attended or 0
        
        return {
            "user_id": user_id,
            "days_since_joining": days_since_joining,
            "profile_completion": profile_completion,
            "hackathons_attended": hackathons_attended,
            "is_verified": user.is_verified,
            "last_login": user.last_login_at,
            "account_status": "active" if user.is_active else "inactive"
        }

    def get_recent_users(self, db: Session, days: int = 30, limit: int = 50) -> List[User]:
        """Get recently registered users"""
        cutoff_date = datetime.utcnow() - timedelta(days=days)
        
        return db.query(User).filter(
            User.created_at >= cutoff_date,
            User.is_active == True
        ).order_by(desc(User.created_at)).limit(limit).all()

    def get_active_users_count(self, db: Session) -> int:
        """Get count of active users"""
        return db.query(User).filter(User.is_active == True).count()

    def get_verified_users_count(self, db: Session) -> int:
        """Get count of verified users"""
        return db.query(User).filter(
            User.is_active == True,
            User.is_verified == True
        ).count()

    def check_username_availability(self, db: Session, username: str, exclude_user_id: Optional[int] = None) -> bool:
        """Check if username is available"""
        query = db.query(User).filter(User.username == username)
        
        if exclude_user_id:
            query = query.filter(User.id != exclude_user_id)
        
        return query.first() is None

    def check_email_availability(self, db: Session, email: str, exclude_user_id: Optional[int] = None) -> bool:
        """Check if email is available"""
        query = db.query(User).filter(User.email == email)
        
        if exclude_user_id:
            query = query.filter(User.id != exclude_user_id)
        
        return query.first() is None

    def bulk_update_users(self, db: Session, user_ids: List[int], update_data: Dict[str, Any]) -> List[User]:
        """Bulk update multiple users"""
        users = db.query(User).filter(User.id.in_(user_ids)).all()
        
        for user in users:
            for field, value in update_data.items():
                if hasattr(user, field):
                    setattr(user, field, value)
            user.updated_at = datetime.utcnow()
        
        db.commit()
        
        # Refresh all users
        for user in users:
            db.refresh(user)
        
        return users

    def get_users_by_role(self, db: Session, is_admin: bool = False) -> List[User]:
        """Get users by role (admin/regular users)"""
        return db.query(User).filter(
            User.is_active == True,
            User.is_admin == is_admin
        ).all()

# Create instance
user_crud = UserCRUD()