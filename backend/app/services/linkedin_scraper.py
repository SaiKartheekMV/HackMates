# hackmates-backend/app/services/linkedin_scraper.py
import asyncio
import json
import re
from typing import Dict, List, Optional, Any
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.chrome.options import Options
from selenium.common.exceptions import TimeoutException, NoSuchElementException
from bs4 import BeautifulSoup
import time
import logging
from app.core.config import settings

logger = logging.getLogger(__name__)

class LinkedInScraper:
    def __init__(self):
        self.driver = None
        self.wait = None
        self.setup_driver()
    
    def setup_driver(self):
        """Setup Chrome WebDriver with options"""
        chrome_options = Options()
        chrome_options.add_argument('--headless')  # Run in background
        chrome_options.add_argument('--no-sandbox')
        chrome_options.add_argument('--disable-dev-shm-usage')
        chrome_options.add_argument('--disable-gpu')
        chrome_options.add_argument('--window-size=1920,1080')
        chrome_options.add_argument('--user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36')
        
        # Disable images and CSS for faster loading
        prefs = {
            "profile.managed_default_content_settings.images": 2,
            "profile.managed_default_content_settings.stylesheets": 2
        }
        chrome_options.add_experimental_option("prefs", prefs)
        
        try:
            self.driver = webdriver.Chrome(options=chrome_options)
            self.wait = WebDriverWait(self.driver, 10)
        except Exception as e:
            logger.error(f"Failed to setup WebDriver: {e}")
            raise
    
    def close_driver(self):
        """Close the WebDriver"""
        if self.driver:
            self.driver.quit()
    
    def extract_profile_data(self, profile_url: str) -> Dict[str, Any]:
        """
        Extract profile data from LinkedIn URL
        Note: This is for educational purposes. In production, use LinkedIn's official API
        """
        try:
            # Validate LinkedIn URL
            if not self.is_valid_linkedin_url(profile_url):
                raise ValueError("Invalid LinkedIn profile URL")
            
            self.driver.get(profile_url)
            time.sleep(3)  # Wait for page load
            
            # Check if we can access the profile
            if self.is_profile_restricted():
                return {
                    "error": "Profile is private or requires LinkedIn login",
                    "success": False
                }
            
            profile_data = {
                "name": self.extract_name(),
                "headline": self.extract_headline(),
                "location": self.extract_location(),
                "about": self.extract_about(),
                "experience": self.extract_experience(),
                "education": self.extract_education(),
                "skills": self.extract_skills(),
                "projects": self.extract_projects(),
                "certifications": self.extract_certifications(),
                "languages": self.extract_languages(),
                "success": True
            }
            
            return profile_data
            
        except Exception as e:
            logger.error(f"Error extracting LinkedIn profile: {e}")
            return {
                "error": str(e),
                "success": False
            }
    
    def is_valid_linkedin_url(self, url: str) -> bool:
        """Validate LinkedIn profile URL"""
        linkedin_pattern = r'https?://(?:www\.)?linkedin\.com/in/[\w\-]+'
        return bool(re.match(linkedin_pattern, url))
    
    def is_profile_restricted(self) -> bool:
        """Check if profile is restricted/private"""
        try:
            # Look for sign-in prompts or restricted access messages
            restricted_indicators = [
                "Sign in to LinkedIn",
                "Join LinkedIn",
                "You need to sign in",
                "authwall"
            ]
            
            page_source = self.driver.page_source.lower() # type: ignore
            return any(indicator.lower() in page_source for indicator in restricted_indicators)
            
        except Exception:
            return True
    
    def extract_name(self) -> Optional[str]:
        """Extract user's name"""
        try:
            name_selectors = [
                "h1.text-heading-xlarge",
                ".pv-text-details__left-panel h1",
                "[data-generated-suggestion-target] h1"
            ]
            
            for selector in name_selectors:
                try:
                    element = self.wait.until(EC.presence_of_element_located((By.CSS_SELECTOR, selector)))
                    return element.text.strip()
                except TimeoutException:
                    continue
                    
        except Exception as e:
            logger.warning(f"Could not extract name: {e}")
        return None
    
    def extract_headline(self) -> Optional[str]:
        """Extract user's professional headline"""
        try:
            headline_selectors = [
                ".text-body-medium.break-words",
                ".pv-text-details__left-panel .text-body-medium",
                "[data-generated-suggestion-target] .text-body-medium"
            ]
            
            for selector in headline_selectors:
                try:
                    element = self.driver.find_element(By.CSS_SELECTOR, selector)
                    return element.text.strip()
                except NoSuchElementException:
                    continue
                    
        except Exception as e:
            logger.warning(f"Could not extract headline: {e}")
        return None
    
    def extract_location(self) -> Optional[str]:
        """Extract user's location"""
        try:
            location_selectors = [
                ".text-body-small.inline.t-black--light.break-words",
                ".pv-text-details__left-panel .text-body-small"
            ]
            
            for selector in location_selectors:
                try:
                    element = self.driver.find_element(By.CSS_SELECTOR, selector)
                    return element.text.strip()
                except NoSuchElementException:
                    continue
                    
        except Exception as e:
            logger.warning(f"Could not extract location: {e}")
        return None
    
    def extract_about(self) -> Optional[str]:
        """Extract about/summary section"""
        try:
            about_selectors = [
                "[data-generated-suggestion-target='about'] .inline-show-more-text__text",
                ".pv-about-section .inline-show-more-text__text",
                "#about ~ .pvs-list__outer-container .inline-show-more-text__text"
            ]
            
            for selector in about_selectors:
                try:
                    element = self.driver.find_element(By.CSS_SELECTOR, selector)
                    return element.text.strip()
                except NoSuchElementException:
                    continue
                    
        except Exception as e:
            logger.warning(f"Could not extract about section: {e}")
        return None
    
    def extract_experience(self) -> List[Dict[str, str]]:
        """Extract work experience"""
        try:
            experiences = []
            
            # Look for experience section
            experience_section = self.driver.find_element(
                By.CSS_SELECTOR, 
                "[data-generated-suggestion-target='experience'], #experience"
            )
            
            # Find all experience items
            exp_items = experience_section.find_elements(
                By.CSS_SELECTOR, 
                ".pvs-list__item--line-separated"
            )
            
            for item in exp_items[:5]:  # Limit to first 5 experiences
                try:
                    # Extract job title
                    title_elem = item.find_element(By.CSS_SELECTOR, ".mr1.t-bold span")
                    title = title_elem.get_attribute("aria-hidden") == "true" and title_elem.text or ""
                    
                    # Extract company
                    company_elem = item.find_element(By.CSS_SELECTOR, ".t-14.t-normal span")
                    company = company_elem.text.strip()
                    
                    # Extract duration
                    duration_elem = item.find_element(By.CSS_SELECTOR, ".t-14.t-black--light span")
                    duration = duration_elem.text.strip()
                    
                    experiences.append({
                        "title": title,
                        "company": company,
                        "duration": duration
                    })
                    
                except NoSuchElementException:
                    continue
            
            return experiences
            
        except Exception as e:
            logger.warning(f"Could not extract experience: {e}")
            return []
    
    def extract_education(self) -> List[Dict[str, str]]:
        """Extract education details"""
        try:
            education_list = []
            
            # Look for education section
            education_section = self.driver.find_element(
                By.CSS_SELECTOR,
                "[data-generated-suggestion-target='education'], #education"
            )
            
            edu_items = education_section.find_elements(
                By.CSS_SELECTOR,
                ".pvs-list__item--line-separated"
            )
            
            for item in edu_items[:3]:  # Limit to first 3 education entries
                try:
                    # Extract school name
                    school_elem = item.find_element(By.CSS_SELECTOR, ".mr1.t-bold span")
                    school = school_elem.text.strip()
                    
                    # Extract degree
                    degree_elem = item.find_element(By.CSS_SELECTOR, ".t-14.t-normal span")
                    degree = degree_elem.text.strip()
                    
                    education_list.append({
                        "school": school,
                        "degree": degree
                    })
                    
                except NoSuchElementException:
                    continue
            
            return education_list
            
        except Exception as e:
            logger.warning(f"Could not extract education: {e}")
            return []
    
    def extract_skills(self) -> List[str]:
        """Extract skills (limited without login)"""
        try:
            skills = []
            
            # Try to find skills section
            skills_section = self.driver.find_element(
                By.CSS_SELECTOR,
                "[data-generated-suggestion-target='skills'], #skills"
            )
            
            skill_items = skills_section.find_elements(
                By.CSS_SELECTOR,
                ".mr1.t-bold span"
            )
            
            for item in skill_items[:10]:  # Limit to first 10 skills
                skill_text = item.text.strip()
                if skill_text and skill_text not in skills:
                    skills.append(skill_text)
            
            return skills
            
        except Exception as e:
            logger.warning(f"Could not extract skills: {e}")
            return []
    
    def extract_projects(self) -> List[Dict[str, str]]:
        """Extract projects section"""
        try:
            projects = []
            
            projects_section = self.driver.find_element(
                By.CSS_SELECTOR,
                "[data-generated-suggestion-target='projects'], #projects"
            )
            
            project_items = projects_section.find_elements(
                By.CSS_SELECTOR,
                ".pvs-list__item--line-separated"
            )
            
            for item in project_items[:3]:  # Limit to first 3 projects
                try:
                    title_elem = item.find_element(By.CSS_SELECTOR, ".mr1.t-bold span")
                    title = title_elem.text.strip()
                    
                    desc_elem = item.find_element(By.CSS_SELECTOR, ".t-14.t-normal span")
                    description = desc_elem.text.strip()
                    
                    projects.append({
                        "title": title,
                        "description": description
                    })
                    
                except NoSuchElementException:
                    continue
            
            return projects
            
        except Exception as e:
            logger.warning(f"Could not extract projects: {e}")
            return []
    
    def extract_certifications(self) -> List[str]:
        """Extract certifications"""
        try:
            certifications = []
            
            cert_section = self.driver.find_element(
                By.CSS_SELECTOR,
                "[data-generated-suggestion-target='certifications'], #certifications"
            )
            
            cert_items = cert_section.find_elements(
                By.CSS_SELECTOR,
                ".mr1.t-bold span"
            )
            
            for item in cert_items[:5]:  # Limit to first 5 certifications
                cert_text = item.text.strip()
                if cert_text:
                    certifications.append(cert_text)
            
            return certifications
            
        except Exception as e:
            logger.warning(f"Could not extract certifications: {e}")
            return []
    
    def extract_languages(self) -> List[str]:
        """Extract languages"""
        try:
            languages = []
            
            lang_section = self.driver.find_element(
                By.CSS_SELECTOR,
                "[data-generated-suggestion-target='languages'], #languages"
            )
            
            lang_items = lang_section.find_elements(
                By.CSS_SELECTOR,
                ".mr1.t-bold span"
            )
            
            for item in lang_items:
                lang_text = item.text.strip()
                if lang_text:
                    languages.append(lang_text)
            
            return languages
            
        except Exception as e:
            logger.warning(f"Could not extract languages: {e}")
            return []

# Async wrapper for the scraper
class AsyncLinkedInScraper:
    @staticmethod
    async def scrape_profile(profile_url: str) -> Dict[str, Any]:
        """Async wrapper for profile scraping"""
        def run_scraper():
            scraper = LinkedInScraper()
            try:
                return scraper.extract_profile_data(profile_url)
            finally:
                scraper.close_driver()
        
        # Run in thread pool to avoid blocking
        loop = asyncio.get_event_loop()
        return await loop.run_in_executor(None, run_scraper)

# Service functions
async def scrape_linkedin_profile(profile_url: str) -> Dict[str, Any]:
    """
    Main function to scrape LinkedIn profile
    
    WARNING: This is for educational purposes only.
    In production, use LinkedIn's official API or user-provided data.
    Web scraping may violate LinkedIn's Terms of Service.
    """
    
    # Rate limiting and error handling
    try:
        result = await AsyncLinkedInScraper.scrape_profile(profile_url)
        
        if result.get("success"):
            # Process and clean the data
            processed_data = process_linkedin_data(result)
            return processed_data
        else:
            return result
            
    except Exception as e:
        logger.error(f"LinkedIn scraping failed: {e}")
        return {
            "error": "Failed to scrape LinkedIn profile",
            "success": False
        }

def process_linkedin_data(raw_data: Dict[str, Any]) -> Dict[str, Any]:
    """Process and clean scraped LinkedIn data"""
    
    # Extract skills from various sections
    all_skills = set()
    
    # Add explicit skills
    if raw_data.get("skills"):
        all_skills.update(raw_data["skills"])
    
    # Extract skills from experience descriptions
    if raw_data.get("experience"):
        for exp in raw_data["experience"]:
            title = exp.get("title", "").lower()
            # Simple skill extraction from job titles
            tech_keywords = ["python", "javascript", "react", "node", "sql", "aws", "docker", "git"]
            for keyword in tech_keywords:
                if keyword in title:
                    all_skills.add(keyword.title())
    
    return {
        "name": raw_data.get("name"),
        "headline": raw_data.get("headline"),
        "location": raw_data.get("location"),
        "about": raw_data.get("about"),
        "experience": raw_data.get("experience", []),
        "education": raw_data.get("education", []),
        "skills": list(all_skills),
        "projects": raw_data.get("projects", []),
        "certifications": raw_data.get("certifications", []),
        "languages": raw_data.get("languages", []),
        "success": True
    }