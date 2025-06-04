// src/services/resumeParserService.js
const aiService = require('./aiService');
const { cloudinary } = require('../config/cloudinary');

class ResumeParserService {
  constructor() {
    this.skillKeywords = [
      // Programming Languages
      'javascript', 'python', 'java', 'c++', 'c#', 'go', 'rust', 'php', 'ruby', 'swift', 'kotlin',
      'typescript', 'scala', 'r', 'matlab', 'sql', 'html', 'css', 'sass', 'less',
      
      // Frameworks & Libraries
      'react', 'angular', 'vue', 'node.js', 'express', 'django', 'flask', 'spring', 'laravel',
      'rails', 'asp.net', 'jquery', 'bootstrap', 'tailwind', 'next.js', 'nuxt.js', 'gatsby',
      
      // Databases
      'mongodb', 'mysql', 'postgresql', 'redis', 'elasticsearch', 'cassandra', 'dynamodb',
      'sqlite', 'oracle', 'firebase', 'supabase',
      
      // Cloud & DevOps
      'aws', 'azure', 'gcp', 'docker', 'kubernetes', 'jenkins', 'gitlab', 'github actions',
      'terraform', 'ansible', 'vagrant', 'nginx', 'apache',
      
      // Tools & Technologies
      'git', 'linux', 'bash', 'powershell', 'api', 'rest', 'graphql', 'websocket', 'jwt',
      'oauth', 'microservices', 'serverless', 'blockchain', 'machine learning', 'ai', 'ml',
      'deep learning', 'tensorflow', 'pytorch', 'scikit-learn', 'pandas', 'numpy',
      
      // Design & UX
      'figma', 'sketch', 'adobe', 'photoshop', 'illustrator', 'ui/ux', 'user experience',
      'user interface', 'wireframing', 'prototyping'
    ];

    this.experiencePatterns = [
      /(\d+)\s*(?:\+)?\s*(?:years?|yrs?)\s*(?:of\s*)?(?:experience|exp)/gi,
      /(?:experience|exp)\s*(?:of\s*)?(\d+)\s*(?:\+)?\s*(?:years?|yrs?)/gi,
      /(\d{4})\s*[-–]\s*(\d{4}|present|current)/gi,
      /(\d{1,2})\/(\d{4})\s*[-–]\s*(\d{1,2})\/(\d{4}|present|current)/gi
    ];

    this.educationPatterns = [
      /(?:bachelor|b\.?s\.?|b\.?a\.?|b\.?e\.?|b\.?tech|bachelors?)/gi,
      /(?:master|m\.?s\.?|m\.?a\.?|m\.?e\.?|m\.?tech|masters?|mba)/gi,
      /(?:phd|ph\.?d\.?|doctorate|doctoral)/gi,
      /(?:diploma|certificate|certification)/gi
    ];

    this.sectionHeaders = {
      experience: /(?:experience|employment|work\s+history|professional\s+experience|career)/gi,
      education: /(?:education|academic|qualifications|degrees?)/gi,
      skills: /(?:skills|technical\s+skills|competencies|technologies|tools)/gi,
      projects: /(?:projects?|portfolio|work\s+samples)/gi,
      contact: /(?:contact|personal\s+info|details)/gi
    };
  }

  // Main parsing function
  async parseResume(resumeBuffer, fileName) {
    try {
      // First try AI service parsing
      let parsedData;
      try {
        parsedData = await aiService.parseResume(resumeBuffer);
      } catch (aiError) {
        console.warn('AI parsing failed, falling back to rule-based parsing:', aiError);
        // Fallback to rule-based parsing
        const text = await this.extractTextFromFile(resumeBuffer, fileName);
        parsedData = this.ruleBasedParsing(text);
      }

      // Enhance and validate parsed data
      const enhancedData = this.enhanceAndValidateParsedData(parsedData);

      return enhancedData;
    } catch (error) {
      console.error('Resume parsing error:', error);
      throw new Error('Failed to parse resume');
    }
  }

  // Extract text from different file formats
  async extractTextFromFile(buffer, fileName) {
    const fileExtension = fileName.split('.').pop().toLowerCase();
    
    try {
      switch (fileExtension) {
        case 'pdf':
          return await this.extractTextFromPDF(buffer);
        case 'doc':
        case 'docx':
          return await this.extractTextFromWord(buffer);
        case 'txt':
          return buffer.toString('utf-8');
        default:
          throw new Error(`Unsupported file format: ${fileExtension}`);
      }
    } catch (error) {
      throw new Error(`Failed to extract text from ${fileExtension} file`);
    }
  }

  // Extract text from PDF (simplified - in production use pdf-parse)
  async extractTextFromPDF(buffer) {
    // This is a placeholder - implement with pdf-parse library
    // const pdf = require('pdf-parse');
    // const data = await pdf(buffer);
    // return data.text;
    
    // For now, return empty string and rely on AI service
    return '';
  }

  // Extract text from Word documents (simplified - in production use mammoth)
  async extractTextFromWord(buffer) {
    // This is a placeholder - implement with mammoth library
    // const mammoth = require('mammoth');
    // const result = await mammoth.extractRawText({ buffer });
    // return result.value;
    
    // For now, return empty string and rely on AI service
    return '';
  }

  // Rule-based parsing as fallback
  ruleBasedParsing(text) {
    const sections = this.identifySections(text);
    
    return {
      skills: this.extractSkills(sections.skills || text),
      experience: this.extractExperience(sections.experience || text),
      education: this.extractEducation(sections.education || text),
      projects: this.extractProjects(sections.projects || text),
      contact: this.extractContactInfo(sections.contact || text)
    };
  }

  // Identify different sections in resume text
  identifySections(text) {
    const sections = {};
    const lines = text.split('\n').map(line => line.trim()).filter(line => line);
    
    let currentSection = 'general';
    let sectionContent = [];
    
    for (const line of lines) {
      let foundSection = false;
      
      for (const [sectionName, pattern] of Object.entries(this.sectionHeaders)) {
        if (pattern.test(line)) {
          // Save previous section
          if (sectionContent.length > 0) {
            sections[currentSection] = sectionContent.join('\n');
          }
          
          currentSection = sectionName;
          sectionContent = [];
          foundSection = true;
          break;
        }
      }
      
      if (!foundSection) {
        sectionContent.push(line);
      }
    }
    
    // Save last section
    if (sectionContent.length > 0) {
      sections[currentSection] = sectionContent.join('\n');
    }
    
    return sections;
  }

  // Extract skills from text
  extractSkills(text) {
    const foundSkills = [];
    const textLower = text.toLowerCase();
    
    for (const skill of this.skillKeywords) {
      const skillRegex = new RegExp(`\\b${skill.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'gi');
      if (skillRegex.test(textLower)) {
        foundSkills.push(skill);
      }
    }
    
    // Also look for comma-separated skills
    const skillLines = text.split('\n').filter(line => 
      line.includes(',') && line.split(',').length > 2
    );
    
    for (const line of skillLines) {
      const skills = line.split(',').map(s => s.trim()).filter(s => s.length > 2);
      foundSkills.push(...skills);
    }
    
    return [...new Set(foundSkills)]; // Remove duplicates
  }

  // Extract experience information
  extractExperience(text) {
    const experience = [];
    const lines = text.split('\n').filter(line => line