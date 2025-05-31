import PyPDF2
import docx
import re
from typing import Dict, List, Optional
import os

class ResumeParser:
    def __init__(self):
        # Common technical skills to extract
        self.common_skills = {
            # Programming Languages
            'python', 'javascript', 'java', 'c++', 'c#', 'php', 'ruby', 'go', 'rust', 'swift',
            'kotlin', 'typescript', 'scala', 'r', 'matlab', 'perl', 'lua', 'dart',
            
            # Web Technologies
            'html', 'css', 'react', 'angular', 'vue', 'nodejs', 'express', 'django', 'flask',
            'fastapi', 'spring', 'laravel', 'rails', 'nextjs', 'nuxt', 'svelte',
            
            # Databases
            'mysql', 'postgresql', 'mongodb', 'redis', 'sqlite', 'oracle', 'cassandra',
            'dynamodb', 'neo4j', 'elasticsearch',
            
            # Cloud & DevOps
            'aws', 'azure', 'gcp', 'docker', 'kubernetes', 'jenkins', 'git', 'github',
            'gitlab', 'terraform', 'ansible', 'nginx', 'apache',
            
            # AI/ML
            'tensorflow', 'pytorch', 'scikit-learn', 'pandas', 'numpy', 'opencv', 'keras',
            'machine learning', 'deep learning', 'nlp', 'computer vision',
            
            # Mobile
            'android', 'ios', 'react native', 'flutter', 'xamarin',
            
            # Tools & Others
            'figma', 'photoshop', 'illustrator', 'sketch', 'blender', 'unity', 'unreal',
            'blockchain', 'solidity', 'web3', 'ethereum'
        }
    
    def parse_resume(self, file_path: str) -> Dict:
        """Parse resume file and extract information"""
        
        try:
            # Extract text based on file type
            text = ""
            file_extension = os.path.splitext(file_path)[1].lower()
            
            if file_extension == '.pdf':
                text = self._extract_text_from_pdf(file_path)
            elif file_extension in ['.doc', '.docx']:
                text = self._extract_text_from_docx(file_path)
            else:
                raise ValueError("Unsupported file format")
            
            # Extract information from text
            extracted_info = {
                'text': text,
                'skills': self._extract_skills(text),
                'experience_level': self._determine_experience_level(text),
                'summary': self._extract_summary(text),
                'education': self._extract_education(text),
                'contact_info': self._extract_contact_info(text)
            }
            
            return extracted_info
            
        except Exception as e:
            raise Exception(f"Failed to parse resume: {str(e)}")
    
    def _extract_text_from_pdf(self, file_path: str) -> str:
        """Extract text from PDF file"""
        text = ""
        try:
            with open(file_path, 'rb') as file:
                pdf_reader = PyPDF2.PdfReader(file)
                for page in pdf_reader.pages:
                    text += page.extract_text() + "\n"
        except Exception as e:
            raise Exception(f"Failed to extract text from PDF: {str(e)}")
        
        return text
    
    def _extract_text_from_docx(self, file_path: str) -> str:
        """Extract text from DOCX file"""
        try:
            doc = docx.Document(file_path)
            text = ""
            for paragraph in doc.paragraphs:
                text += paragraph.text + "\n"
            return text
        except Exception as e:
            raise Exception(f"Failed to extract text from DOCX: {str(e)}")
    
    def _extract_skills(self, text: str) -> List[str]:
        """Extract technical skills from text"""
        text_lower = text.lower()
        found_skills = []
        
        for skill in self.common_skills:
            # Use word boundaries to avoid partial matches
            pattern = r'\b' + re.escape(skill.lower()) + r'\b'
            if re.search(pattern, text_lower):
                found_skills.append(skill.title())
        
        # Remove duplicates and return
        return list(set(found_skills))
    
    def _determine_experience_level(self, text: str) -> str:
        """Determine experience level based on resume content"""
        text_lower = text.lower()
        
        # Count experience indicators
        senior_indicators = ['senior', 'lead', 'principal', 'architect', 'manager', 'director']
        intermediate_indicators = ['developer', 'engineer', 'analyst', 'specialist']
        
        senior_count = sum(1 for indicator in senior_indicators if indicator in text_lower)
        
        # Check for years of experience
        years_pattern = r'(\d+)\+?\s*years?\s*(?:of\s*)?experience'
        years_matches = re.findall(years_pattern, text_lower)
        
        max_years = 0
        if years_matches:
            max_years = max(int(year) for year in years_matches)
        
        # Determine level
        if senior_count >= 2 or max_years >= 5:
            return "advanced"
        elif max_years >= 2 or any(indicator in text_lower for indicator in intermediate_indicators):
            return "intermediate"
        else:
            return "beginner"
    
    def _extract_summary(self, text: str) -> str:
        """Extract professional summary or objective"""
        lines = text.split('\n')
        summary = ""
        
        summary_keywords = ['summary', 'objective', 'profile', 'about']
        
        for i, line in enumerate(lines):
            line_lower = line.lower().strip()
            if any(keyword in line_lower for keyword in summary_keywords):
                # Take next few lines as summary
                summary_lines = []
                for j in range(i + 1, min(i + 4, len(lines))):
                    if lines[j].strip():
                        summary_lines.append(lines[j].strip())
                    else:
                        break
                summary = ' '.join(summary_lines)
                break
        
        return summary[:300] if summary else ""  # Limit to 300 characters
    
    def _extract_education(self, text: str) -> List[str]:
        """Extract education information"""
        education = []
        degree_keywords = ['bachelor', 'master', 'phd', 'doctorate', 'diploma', 'certificate']
        
        lines = text.split('\n')
        for line in lines:
            line_lower = line.lower()
            if any(keyword in line_lower for keyword in degree_keywords):
                education.append(line.strip())
        
        return education[:3]  # Limit to 3 entries
    
    def _extract_contact_info(self, text: str) -> Dict[str, Optional[str]]:
        """Extract contact information"""
        email_pattern = r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b'
        phone_pattern = r'[\+]?[\d\s\-\(\)]{10,}'
        
        email_matches = re.findall(email_pattern, text)
        phone_matches = re.findall(phone_pattern, text)
        
        return {
            'email': email_matches[0] if email_matches else None,
            'phone': phone_matches[0].strip() if phone_matches else None
        }