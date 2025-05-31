from sqlalchemy.orm import Session
from sqlalchemy import and_, func, text
from typing import List, Optional
import json
from app.models.user import User
from app.models.profile import Profile
from app.schemas.matchmaking import MatchPreferences, UserMatch

class MatchmakingService:
    def __init__(self, db: Session):
        self.db = db
    
    def find_matches(
        self, 
        current_user_id: int, 
        preferences: MatchPreferences, 
        limit: int = 10
    ) -> List[UserMatch]:
        """Find compatible teammates using skills-based matching"""
        
        # Get current user's profile
        current_profile = self.db.query(Profile).filter(Profile.user_id == current_user_id).first()
        if not current_profile:
            return []
        
        # Base query for potential matches
        query = self.db.query(User, Profile).join(Profile).filter(
            and_(
                User.id != current_user_id,
                User.is_active == True,
                Profile.skills != None,
                func.json_array_length(Profile.skills) > 0
            )
        )
        
        # Apply experience level filter
        if preferences.experience_level:
            query = query.filter(Profile.experience_level == preferences.experience_level)
        
        # Apply location filter if specified
        if preferences.location_preference:
            query = query.filter(Profile.location.ilike(f"%{preferences.location_preference}%"))
        
        # Get all potential matches
        potential_matches = query.all()
        
        # Calculate compatibility scores
        matches = []
        current_skills = set(current_profile.skills or []) # type: ignore
        preferred_skills = set(preferences.preferred_skills or [])
        
        for user, profile in potential_matches:
            user_skills = set(profile.skills or [])
            
            # Calculate skill compatibility
            skill_overlap = len(current_skills.intersection(user_skills))
            preferred_overlap = len(preferred_skills.intersection(user_skills))
            
            # Base compatibility score
            compatibility_score = 0.0
            
            # Skills matching (40% weight)
            if len(current_skills) > 0:
                skill_score = skill_overlap / max(len(current_skills), len(user_skills))
                compatibility_score += skill_score * 0.4
            
            # Preferred skills matching (30% weight)
            if len(preferred_skills) > 0:
                preferred_score = preferred_overlap / len(preferred_skills)
                compatibility_score += preferred_score * 0.3
            
            # Experience level compatibility (20% weight)
            exp_levels = {"beginner": 1, "intermediate": 2, "advanced": 3}
            current_exp = exp_levels.get(current_profile.experience_level, 1) # type: ignore
            user_exp = exp_levels.get(profile.experience_level, 1)
            exp_score = 1 - abs(current_exp - user_exp) / 2
            compatibility_score += exp_score * 0.2
            
            # Profile completeness (10% weight)
            profile_completeness = profile.profile_score / 100
            compatibility_score += profile_completeness * 0.1
            
            # Only include matches with reasonable compatibility
            if compatibility_score > 0.1:
                matches.append(UserMatch(
                    user_id=user.id,
                    username=user.username,
                    full_name=user.full_name,
                    skills=profile.skills or [],
                    experience_level=profile.experience_level,
                    location=profile.location,
                    bio=profile.bio,
                    github_url=profile.github_url,
                    compatibility_score=round(compatibility_score * 100, 2),
                    matching_skills=list(current_skills.intersection(user_skills)),
                    profile_score=profile.profile_score
                ))
        
        # Sort by compatibility score and return top matches
        matches.sort(key=lambda x: x.compatibility_score, reverse=True)
        return matches[:limit]
    
    def get_skill_recommendations(self, user_id: int) -> List[str]:
        """Get skill recommendations based on popular skills in platform"""
        
        # Get most common skills from all profiles
        result = self.db.execute(text("""
            SELECT skill, COUNT(*) as count 
            FROM (
                SELECT json_each.value as skill 
                FROM profiles, json_each(profiles.skills)
            ) 
            GROUP BY skill 
            ORDER BY count DESC 
            LIMIT 20
        """)).fetchall()
        
        return [row[0] for row in result]