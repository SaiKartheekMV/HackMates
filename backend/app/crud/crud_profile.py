from sqlalchemy.orm import Session
from sqlalchemy import and_, or_, func, desc
from typing import List, Optional, Dict, Any
from app.models.profile import Profile
from app.models.user import User
from app.schemas.profile import ProfileCreate, ProfileUpdate
import json

class ProfileCRUD:
    def create_profile(self, db: Session, profile_data: ProfileCreate, user_id: int) -> Profile:
        """Create user profile"""
        db_profile = Profile(
            user_id=user_id,
            bio=profile_data.bio,
            location=profile_data.location,
            skills=profile_data.skills,
            experience_level=profile_data.experience_level,
            interests=profile_data.interests,
            github_url=profile_data.github_url,
            linkedin_url=profile_data.linkedin_url,
            portfolio_url=profile_data.portfolio_url,
            resume_url=profile_data.resume_url,
            availability=profile_data.availability,
            preferred_roles=profile_data.preferred_roles,
            hackathons_attended=profile_data.hackathons_attended,
            looking_for_team=profile_data.looking_for_team,
            timezone=profile_data.timezone,
            languages=profile_data.languages
        )
        db.add(db_profile)
        db.commit()
        db.refresh(db_profile)
        return db_profile

    def get_profile_by_user_id(self, db: Session, user_id: int) -> Optional[Profile]:
        """Get profile by user ID"""
        return db.query(Profile).filter(Profile.user_id == user_id).first()

    def get_profile_by_id(self, db: Session, profile_id: int) -> Optional[Profile]:
        """Get profile by profile ID"""
        return db.query(Profile).filter(Profile.id == profile_id).first()

    def update_profile(self, db: Session, profile_id: int, profile_data: ProfileUpdate) -> Optional[Profile]:
        """Update profile"""
        db_profile = db.query(Profile).filter(Profile.id == profile_id).first()
        if not db_profile:
            return None
        
        update_data = profile_data.dict(exclude_unset=True)
        for field, value in update_data.items():
            setattr(db_profile, field, value)
            
        db.commit()
        db.refresh(db_profile)
        return db_profile

    def delete_profile(self, db: Session, profile_id: int) -> bool:
        """Delete profile"""
        db_profile = db.query(Profile).filter(Profile.id == profile_id).first()
        if not db_profile:
            return False
        
        db.delete(db_profile)
        db.commit()
        return True

    def get_profiles_by_skills(self, db: Session, skills: List[str], limit: int = 10) -> List[Profile]:
        """Get profiles that match given skills"""
        # Convert skills to lowercase for case-insensitive matching
        skills_lower = [skill.lower() for skill in skills]
        
        profiles = db.query(Profile).join(User).filter(
            User.is_active == True,
            Profile.looking_for_team == True
        ).all()
        
        # Filter profiles by skill matching
        matching_profiles = []
        for profile in profiles:
            if profile.skills:
                profile_skills = [skill.lower().strip() for skill in profile.skills]
                # Check for skill overlap
                if any(skill in profile_skills for skill in skills_lower):
                    matching_profiles.append(profile)
        
        return matching_profiles[:limit]

    def get_profiles_by_location(self, db: Session, location: str, radius_km: int = 50) -> List[Profile]:
        """Get profiles by location (simple string matching for now)"""
        return db.query(Profile).join(User).filter(
            User.is_active == True,
            Profile.location.ilike(f"%{location}%"),
            Profile.looking_for_team == True
        ).limit(20).all()

    def get_profiles_by_experience(self, db: Session, min_level: str, max_level: str = None) -> List[Profile]:
        """Get profiles by experience level"""
        experience_levels = {
            "beginner": 1,
            "intermediate": 2,
            "advanced": 3,
            "expert": 4
        }
        
        min_exp = experience_levels.get(min_level.lower(), 1)
        max_exp = experience_levels.get(max_level.lower(), 4) if max_level else 4
        
        return db.query(Profile).join(User).filter(
            User.is_active == True,
            Profile.experience_level.in_([
                level for level, num in experience_levels.items() 
                if min_exp <= num <= max_exp
            ]),
            Profile.looking_for_team == True
        ).all()

    def search_profiles(self, db: Session, 
                       skills: Optional[List[str]] = None,
                       location: Optional[str] = None,
                       experience_level: Optional[str] = None,
                       interests: Optional[List[str]] = None,
                       available_only: bool = True,
                       limit: int = 20) -> List[Profile]:
        """Advanced profile search with multiple filters"""
        query = db.query(Profile).join(User).filter(User.is_active == True)
        
        if available_only:
            query = query.filter(Profile.looking_for_team == True)
        
        if location:
            query = query.filter(Profile.location.ilike(f"%{location}%"))
            
        if experience_level:
            query = query.filter(Profile.experience_level == experience_level)
        
        profiles = query.limit(limit * 2).all()  # Get more to filter by skills/interests
        
        # Filter by skills and interests in Python for more flexible matching
        filtered_profiles = []
        for profile in profiles:
            score = 0
            
            # Score by skill match
            if skills and profile.skills:
                profile_skills = [s.lower().strip() for s in profile.skills]
                skill_matches = sum(1 for skill in skills if skill.lower() in profile_skills)
                score += skill_matches * 2
            
            # Score by interest match
            if interests and profile.interests:
                profile_interests = [i.lower().strip() for i in profile.interests]
                interest_matches = sum(1 for interest in interests if interest.lower() in profile_interests)
                score += interest_matches
            
            # Include profile if it has any matches or no specific filters
            if score > 0 or (not skills and not interests):
                filtered_profiles.append((profile, score))
        
        # Sort by score (highest first) and return profiles
        filtered_profiles.sort(key=lambda x: x[1], reverse=True)
        return [profile for profile, score in filtered_profiles[:limit]]

    def get_team_seeking_profiles(self, db: Session, limit: int = 50) -> List[Profile]:
        """Get all profiles actively looking for teams"""
        return db.query(Profile).join(User).filter(
            User.is_active == True,
            Profile.looking_for_team == True
        ).order_by(desc(Profile.updated_at)).limit(limit).all()

    def toggle_team_seeking_status(self, db: Session, user_id: int) -> Optional[Profile]:
        """Toggle looking_for_team status"""
        profile = db.query(Profile).filter(Profile.user_id == user_id).first()
        if not profile:
            return None
        
        profile.looking_for_team = not profile.looking_for_team
        db.commit()
        db.refresh(profile)
        return profile

    def update_resume_url(self, db: Session, user_id: int, resume_url: str) -> Optional[Profile]:
        """Update resume URL for a user"""
        profile = db.query(Profile).filter(Profile.user_id == user_id).first()
        if not profile:
            return None
        
        profile.resume_url = resume_url
        db.commit()
        db.refresh(profile)
        return profile

    def get_profiles_with_github(self, db: Session) -> List[Profile]:
        """Get profiles that have GitHub URLs"""
        return db.query(Profile).join(User).filter(
            User.is_active == True,
            Profile.github_url.isnot(None),
            Profile.github_url != ""
        ).all()

    def get_similar_profiles(self, db: Session, user_id: int, limit: int = 10) -> List[Profile]:
        """Get profiles similar to current user (basic implementation)"""
        current_profile = self.get_profile_by_user_id(db, user_id)
        if not current_profile:
            return []
        
        # Find profiles with similar skills, interests, or experience level
        similar_profiles = []
        
        if current_profile.skills:
            similar_by_skills = self.get_profiles_by_skills(db, current_profile.skills, limit * 2)
            similar_profiles.extend(similar_by_skills)
        
        if current_profile.experience_level:
            similar_by_exp = self.get_profiles_by_experience(db, current_profile.experience_level)
            similar_profiles.extend(similar_by_exp)
        
        # Remove duplicates and current user
        seen_ids = set()
        unique_profiles = []
        for profile in similar_profiles:
            if profile.user_id != user_id and profile.id not in seen_ids:
                seen_ids.add(profile.id)
                unique_profiles.append(profile)
        
        return unique_profiles[:limit]

    def update_hackathon_count(self, db: Session, user_id: int, increment: bool = True) -> Optional[Profile]:
        """Update hackathon attendance count"""
        profile = db.query(Profile).filter(Profile.user_id == user_id).first()
        if not profile:
            return None
        
        if increment:
            profile.hackathons_attended = (profile.hackathons_attended or 0) + 1
        else:
            profile.hackathons_attended = max(0, (profile.hackathons_attended or 0) - 1)
        
        db.commit()
        db.refresh(profile)
        return profile

    def get_profile_completion_score(self, db: Session, user_id: int) -> Dict[str, Any]:
        """Calculate profile completion score"""
        profile = self.get_profile_by_user_id(db, user_id)
        if not profile:
            return {"score": 0, "missing_fields": []}
        
        total_fields = 12
        completed_fields = 0
        missing_fields = []
        
        fields_to_check = [
            ("bio", "Bio"),
            ("location", "Location"),
            ("skills", "Skills"),
            ("experience_level", "Experience Level"),
            ("interests", "Interests"),
            ("github_url", "GitHub URL"),
            ("linkedin_url", "LinkedIn URL"),
            ("portfolio_url", "Portfolio URL"),
            ("resume_url", "Resume"),
            ("preferred_roles", "Preferred Roles"),
            ("timezone", "Timezone"),
            ("languages", "Languages")
        ]
        
        for field, display_name in fields_to_check:
            value = getattr(profile, field)
            if value and (not isinstance(value, list) or len(value) > 0):
                completed_fields += 1
            else:
                missing_fields.append(display_name)
        
        score = int((completed_fields / total_fields) * 100)
        
        return {
            "score": score,
            "completed_fields": completed_fields,
            "total_fields": total_fields,
            "missing_fields": missing_fields
        }

# Create instance
profile_crud = ProfileCRUD()