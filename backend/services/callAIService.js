const axios = require('axios');
const cheerio = require('cheerio');

class ApiService {
  constructor() {
    this.openaiClient = null;
    this.setupOpenAI();
  }

  // Initialize OpenAI client
  setupOpenAI() {
    if (process.env.OPENAI_API_KEY) {
      this.openaiClient = axios.create({
        baseURL: 'https://api.openai.com/v1',
        headers: {
          'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
          'Content-Type': 'application/json',
        },
        timeout: 30000
      });
    }
  }

  // OpenAI GPT API calls
  async callOpenAI(prompt, options = {}) {
    try {
      if (!this.openaiClient) {
        throw new Error('OpenAI API key not configured');
      }

      const response = await this.openaiClient.post('/chat/completions', {
        model: options.model || 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: options.systemPrompt || 'You are a helpful AI assistant for a hackathon collaboration platform.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: options.maxTokens || 1000,
        temperature: options.temperature || 0.7,
      });

      return {
        success: true,
        data: response.data.choices[0].message.content,
        usage: response.data.usage
      };

    } catch (error) {
      console.error('OpenAI API Error:', error.response?.data || error.message);
      return {
        success: false,
        error: error.response?.data?.error?.message || error.message
      };
    }
  }

  // Generate embeddings using OpenAI
  async generateEmbeddings(text) {
    try {
      if (!this.openaiClient) {
        throw new Error('OpenAI API key not configured');
      }

      const response = await this.openaiClient.post('/embeddings', {
        model: 'text-embedding-ada-002',
        input: text
      });

      return {
        success: true,
        embeddings: response.data.data[0].embedding,
        usage: response.data.usage
      };

    } catch (error) {
      console.error('Embeddings API Error:', error.response?.data || error.message);
      return {
        success: false,
        error: error.response?.data?.error?.message || error.message
      };
    }
  }

  // Analyze skills compatibility between users
  async analyzeSkillsCompatibility(user1Skills, user2Skills, hackathonRequirements = []) {
    try {
      const prompt = `
        Analyze the compatibility between two hackathon participants based on their skills:
        
        Participant 1 Skills: ${user1Skills.join(', ')}
        Participant 2 Skills: ${user2Skills.join(', ')}
        ${hackathonRequirements.length > 0 ? `Hackathon Requirements: ${hackathonRequirements.join(', ')}` : ''}
        
        Provide:
        1. Compatibility score (0-100)
        2. Complementary skills
        3. Overlapping skills
        4. Missing skills for the hackathon
        5. Team role suggestions
        
        Format as JSON.
      `;

      const result = await this.callOpenAI(prompt, {
        systemPrompt: 'You are an AI expert in hackathon team formation. Analyze skills and provide structured feedback in JSON format.',
        temperature: 0.3
      });

      if (result.success) {
        try {
          const analysis = JSON.parse(result.data);
          return {
            success: true,
            compatibility: analysis
          };
        } catch (parseError) {
          return {
            success: false,
            error: 'Failed to parse AI response'
          };
        }
      }

      return result;

    } catch (error) {
      console.error('Skills compatibility analysis error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Generate hackathon project ideas
  async generateProjectIdeas(skills, interests, hackathonTheme) {
    try {
      const prompt = `
        Generate 3 innovative hackathon project ideas based on:
        
        Team Skills: ${skills.join(', ')}
        Interests: ${interests.join(', ')}
        Hackathon Theme: ${hackathonTheme}
        
        For each idea provide:
        1. Project name
        2. Brief description
        3. Key features
        4. Technologies to use
        5. Feasibility score (1-10)
        
        Format as JSON array.
      `;

      const result = await this.callOpenAI(prompt, {
        systemPrompt: 'You are a creative AI assistant specializing in hackathon project ideation.',
        temperature: 0.8
      });

      if (result.success) {
        try {
          const ideas = JSON.parse(result.data);
          return {
            success: true,
            projectIdeas: ideas
          };
        } catch (parseError) {
          return {
            success: false,
            error: 'Failed to parse project ideas'
          };
        }
      }

      return result;

    } catch (error) {
      console.error('Project ideas generation error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Scrape LinkedIn profile (Basic implementation - be mindful of LinkedIn's ToS)
  async scrapeLinkedInProfile(profileUrl) {
    try {
      // WARNING: LinkedIn has strict ToS against scraping
      // This is a basic example - use LinkedIn API in production
      
      const response = await axios.get(profileUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        },
        timeout: 10000
      });

      const $ = cheerio.load(response.data);

      // Basic extraction - LinkedIn's structure changes frequently
      const profileData = {
        name: $('h1').first().text().trim() || '',
        headline: $('.text-body-medium').first().text().trim() || '',
        location: $('[data-test-id="profile-location"]').text().trim() || '',
        about: $('[data-test-id="about-section"]').text().trim() || '',
        experience: [],
        education: [],
        skills: []
      };

      // Extract experience (very basic)
      $('.experience-item').each((i, elem) => {
        const title = $(elem).find('.t-16').first().text().trim();
        const company = $(elem).find('.t-14').first().text().trim();
        if (title && company) {
          profileData.experience.push({ title, company });
        }
      });

      return {
        success: true,
        data: profileData,
        warning: 'LinkedIn scraping has limitations and may violate ToS. Use LinkedIn API for production.'
      };

    } catch (error) {
      console.error('LinkedIn scraping error:', error.message);
      return {
        success: false,
        error: 'Failed to scrape LinkedIn profile. Consider using LinkedIn API.',
        suggestion: 'Implement LinkedIn OAuth and use official LinkedIn API'
      };
    }
  }

  // Fetch hackathon events from external APIs
  async fetchHackathonEvents() {
    try {
      const sources = [
        this.fetchDevpostEvents(),
        this.fetchHackerEarthEvents(),
        this.fetchMLHEvents()
      ];

      const results = await Promise.allSettled(sources);
      const events = [];

      results.forEach((result, index) => {
        if (result.status === 'fulfilled' && result.value.success) {
          events.push(...result.value.events);
        }
      });

      return {
        success: true,
        events: events.slice(0, 50), // Limit to 50 events
        sources: ['Devpost', 'HackerEarth', 'MLH']
      };

    } catch (error) {
      console.error('Fetch hackathon events error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Fetch events from Devpost (example)
  async fetchDevpostEvents() {
    try {
      // This is a placeholder - implement actual Devpost API calls
      // You may need to use web scraping or find unofficial APIs
      
      return {
        success: true,
        events: [
          {
            title: 'Sample Hackathon',
            description: 'A sample hackathon event',
            startDate: new Date(),
            endDate: new Date(),
            location: 'Online',
            prize: '$10,000',
            registrationUrl: 'https://example.com',
            source: 'Devpost'
          }
        ]
      };

    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Send notification via email/SMS (using external services)
  async sendNotification(type, recipient, data) {
    try {
      switch (type) {
        case 'email':
          return await this.sendEmail(recipient, data);
        case 'sms':
          return await this.sendSMS(recipient, data);
        case 'slack':
          return await this.sendSlackMessage(recipient, data);
        default:
          throw new Error('Unsupported notification type');
      }
    } catch (error) {
      console.error('Send notification error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Send email notification (using SendGrid/Nodemailer)
  async sendEmail(recipient, data) {
    try {
      // Example using SendGrid API
      if (process.env.SENDGRID_API_KEY) {
        const response = await axios.post('https://api.sendgrid.com/v3/mail/send', {
          personalizations: [{
            to: [{ email: recipient }],
            subject: data.subject
          }],
          from: { email: process.env.FROM_EMAIL || 'noreply@hackmate.ai' },
          content: [{
            type: 'text/html',
            value: data.htmlContent || data.textContent
          }]
        }, {
          headers: {
            'Authorization': `Bearer ${process.env.SENDGRID_API_KEY}`,
            'Content-Type': 'application/json'
          }
        });

        return {
          success: true,
          messageId: response.data
        };
      }

      // Fallback to console log for development
      console.log('Email notification:', { recipient, data });
      return {
        success: true,
        messageId: 'dev-mode-' + Date.now()
      };

    } catch (error) {
      console.error('Email sending error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Send SMS notification (using Twilio)
  async sendSMS(recipient, data) {
    try {
      if (process.env.TWILIO_SID && process.env.TWILIO_TOKEN) {
        const response = await axios.post(
          `https://api.twilio.com/2010-04-01/Accounts/${process.env.TWILIO_SID}/Messages.json`,
          new URLSearchParams({
            To: recipient,
            From: process.env.TWILIO_PHONE,
            Body: data.message
          }),
          {
            headers: {
              'Authorization': `Basic ${Buffer.from(`${process.env.TWILIO_SID}:${process.env.TWILIO_TOKEN}`).toString('base64')}`,
              'Content-Type': 'application/x-www-form-urlencoded'
            }
          }
        );

        return {
          success: true,
          messageId: response.data.sid
        };
      }

      // Fallback for development
      console.log('SMS notification:', { recipient, data });
      return {
        success: true,
        messageId: 'dev-sms-' + Date.now()
      };

    } catch (error) {
      console.error('SMS sending error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Send Slack notification
  async sendSlackMessage(webhookUrl, data) {
    try {
      const response = await axios.post(webhookUrl, {
        text: data.message,
        username: 'HackMateAI Bot',
        icon_emoji: ':robot_face:',
        attachments: data.attachments || []
      });

      return {
        success: true,
        response: response.data
      };

    } catch (error) {
      console.error('Slack notification error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Analyze sentiment of text
  async analyzeSentiment(text) {
    try {
      const prompt = `
        Analyze the sentiment of the following text and provide:
        1. Overall sentiment (positive/negative/neutral)
        2. Confidence score (0-1)
        3. Key emotions detected
        4. Brief explanation
        
        Text: "${text}"
        
        Respond in JSON format.
      `;

      const result = await this.callOpenAI(prompt, {
        systemPrompt: 'You are a sentiment analysis expert. Provide accurate sentiment analysis in JSON format.',
        temperature: 0.2
      });

      if (result.success) {
        try {
          const analysis = JSON.parse(result.data);
          return {
            success: true,
            sentiment: analysis
          };
        } catch (parseError) {
          return {
            success: false,
            error: 'Failed to parse sentiment analysis'
          };
        }
      }

      return result;

    } catch (error) {
      console.error('Sentiment analysis error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Generate team chemistry report
  async generateTeamChemistryReport(teamMembers) {
    try {
      const memberProfiles = teamMembers.map(member => ({
        name: member.name,
        skills: member.skills,
        experience: member.experience,
        workStyle: member.preferences?.workStyle || 'flexible',
        communication: member.preferences?.communication || 'mixed'
      }));

      const prompt = `
        Analyze team chemistry and dynamics for this hackathon team:
        
        Team Members: ${JSON.stringify(memberProfiles, null, 2)}
        
        Provide:
        1. Overall team compatibility score (0-100)
        2. Strengths of the team
        3. Potential challenges
        4. Role recommendations for each member
        5. Communication strategy suggestions
        6. Success probability assessment
        
        Format as detailed JSON.
      `;

      const result = await this.callOpenAI(prompt, {
        systemPrompt: 'You are a team dynamics expert specializing in hackathon teams. Provide comprehensive team analysis.',
        temperature: 0.4,
        maxTokens: 1500
      });

      if (result.success) {
        try {
          const report = JSON.parse(result.data);
          return {
            success: true,
            report: report
          };
        } catch (parseError) {
          return {
            success: false,
            error: 'Failed to parse team chemistry report'
          };
        }
      }

      return result;

    } catch (error) {
      console.error('Team chemistry analysis error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Check API health and status
  async checkAPIHealth() {
    const healthStatus = {
      openai: false,
      email: false,
      sms: false,
      overall: false
    };

    try {
      // Check OpenAI
      if (this.openaiClient) {
        const testResult = await this.callOpenAI('Test message', { maxTokens: 10 });
        healthStatus.openai = testResult.success;
      }

      // Check email service
      if (process.env.SENDGRID_API_KEY) {
        // You could implement a test email send here
        healthStatus.email = true;
      }

      // Check SMS service
      if (process.env.TWILIO_SID && process.env.TWILIO_TOKEN) {
        healthStatus.sms = true;
      }

      healthStatus.overall = healthStatus.openai;

      return {
        success: true,
        status: healthStatus,
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      console.error('API health check error:', error);
      return {
        success: false,
        status: healthStatus,
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }

  // Rate limiting helper
  createRateLimiter(requests, timeWindow) {
    const requests_log = [];
    
    return () => {
      const now = Date.now();
      
      // Remove old requests outside the time window
      while (requests_log.length > 0 && requests_log[0] <= now - timeWindow) {
        requests_log.shift();
      }
      
      // Check if we've exceeded the limit
      if (requests_log.length >= requests) {
        const oldestRequest = requests_log[0];
        const waitTime = timeWindow - (now - oldestRequest);
        throw new Error(`Rate limit exceeded. Try again in ${Math.ceil(waitTime / 1000)} seconds.`);
      }
      
      // Log this request
      requests_log.push(now);
      return true;
    };
  }

  // Utility method to clean and validate URLs
  validateAndCleanUrl(url) {
    try {
      const cleanUrl = url.trim();
      const urlObj = new URL(cleanUrl);
      
      // Basic validation
      if (!['http:', 'https:'].includes(urlObj.protocol)) {
        throw new Error('Invalid protocol');
      }
      
      return {
        valid: true,
        cleanUrl: cleanUrl,
        domain: urlObj.hostname
      };
      
    } catch (error) {
      return {
        valid: false,
        error: 'Invalid URL format'
      };
    }
  }
}

// Create singleton instance
const apiService = new ApiService();

module.exports = apiService; {
        success: false,
        error: error.message
      };
    }
  }

  // Fetch events from HackerEarth (example)
  async fetchHackerEarthEvents() {
    try {
      // Placeholder implementation
      return {
        success: true,
        events: []
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Fetch events from MLH (Major League Hacking)
  async fetchMLHEvents() {
    try {
      // MLH provides an unofficial API
      const response = await axios.get('https://mlh.io/seasons/2024/events', {
        timeout: 10000
      });

      // Parse MLH events (this would need actual implementation)
      return {
        success: true,
        events: []
      };

    } catch (error) {
      return