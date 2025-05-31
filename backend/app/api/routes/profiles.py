from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form
from sqlalchemy.orm import Session
from typing import Optional, List
import os
import uuid
from app.database import get_db
from app.core.security import get_current_user
from app.models.user import User
from app.models.profile import Profile
from app.schemas.profile import ProfileResponse, ProfileUpdate
from app.services.resume_parser import ResumeParser
from app.core.config import settings

router = APIRouter()

@router.get("/", response_model=ProfileResponse)
async def get_user_profile(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get current user's profile"""
    profile = db.query(Profile).filter(Profile.user_id == current_user.id).first()
    
    if not profile:
        # Create profile if doesn't exist
        profile = Profile(user_id=current_user.id)
        db.add(profile)
        db.commit()
        db.refresh(profile)
    
    return ProfileResponse.from_orm(profile)

@router.put("/", response_model=ProfileResponse)
async def update_profile(
    profile_data: ProfileUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update user profile"""
    profile = db.query(Profile).filter(Profile.user_id == current_user.id).first()
    
    if not profile:
        profile = Profile(user_id=current_user.id)
        db.add(profile)
    
    # Update profile fields
    update_data = profile_data.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(profile, field, value)
    
    # Calculate profile completeness score
    profile.profile_score = calculate_profile_score(profile) # type: ignore
    
    db.commit()
    db.refresh(profile)
    
    return ProfileResponse.from_orm(profile)

@router.post("/upload-resume")
async def upload_resume(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Upload and parse resume"""
    
    # Validate file
    if not file.filename.lower().endswith(('.pdf', '.doc', '.docx')): # type: ignore
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only PDF, DOC, and DOCX files are allowed"
        )
    
    if file.size > settings.MAX_FILE_SIZE: # type: ignore
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="File size too large. Maximum 10MB allowed."
        )
    
    try:
        # Create upload directory if it doesn't exist
        os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
        
        # Generate unique filename
        file_extension = os.path.splitext(file.filename)[1] # type: ignore
        unique_filename = f"{uuid.uuid4()}{file_extension}"
        file_path = os.path.join(settings.UPLOAD_DIR, unique_filename)
        
        # Save file
        with open(file_path, "wb") as buffer:
            content = await file.read()
            buffer.write(content)
        
        # Parse resume
        parser = ResumeParser()
        parsed_data = parser.parse_resume(file_path)
        
        # Update user profile with parsed data
        profile = db.query(Profile).filter(Profile.user_id == current_user.id).first()
        if not profile:
            profile = Profile(user_id=current_user.id)
            db.add(profile)
        
        # Update profile with parsed data
        if parsed_data.get('skills'):
            profile.skills = list(set(profile.skills + parsed_data['skills'])) # type: ignore
        
        if parsed_data.get('experience_level'):
            profile.experience_level = parsed_data['experience_level']
        
        profile.resume_text = parsed_data.get('text', '')
        profile.profile_score = calculate_profile_score(profile) # type: ignore
        
        db.commit()
        
        # Clean up uploaded file
        os.remove(file_path)
        
        return {
            "message": "Resume uploaded and processed successfully",
            "parsed_data": {
                "skills": parsed_data.get('skills', []),
                "experience_level": parsed_data.get('experience_level', 'beginner'),
                "summary": parsed_data.get('summary', '')
            }
        }
        
    except Exception as e:
        # Clean up file if it exists
        if 'file_path' in locals() and os.path.exists(file_path):
            os.remove(file_path)
        
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to process resume: {str(e)}"
        )

@router.post("/linkedin")
async def scrape_linkedin(
    linkedin_url: str = Form(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Scrape LinkedIn profile (placeholder for future implementation)"""
    
    # Update profile with LinkedIn URL
    profile = db.query(Profile).filter(Profile.user_id == current_user.id).first()
    if not profile:
        profile = Profile(user_id=current_user.id)
        db.add(profile)
    
    profile.linkedin_url = linkedin_url # type: ignore
    db.commit()
    
    return {
        "message": "LinkedIn URL saved. Full scraping feature coming soon!",
        "linkedin_url": linkedin_url
    }

def calculate_profile_score(profile: Profile) -> float:
    """Calculate profile completeness score (0-100)"""
    score = 0
    max_score = 100
    
    # Basic info (30 points)
    if profile.bio: # type: ignore
        score += 10
    if profile.location: # type: ignore
        score += 5
    if profile.github_url:
        score += 10
    if profile.linkedin_url:
        score += 5
    
    # Skills and experience (40 points)
    if profile.skills and len(profile.skills) > 0:
        score += 20
    if profile.experience_level != "beginner":
        score += 10
    if profile.interests and len(profile.interests) > 0:
        score += 10
    
    # Preferences (20 points)
    if profile.preferred_roles and len(profile.preferred_roles) > 0:
        score += 10
    if profile.availability != "weekends":
        score += 5
    if profile.team_size_preference:
        score += 5
    
    # Resume (10 points)
    if profile.resume_text:
        score += 10
    
    return min(score, max_score)