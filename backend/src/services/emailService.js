// src/services/emailService.js
const nodemailer = require('nodemailer');
const sgMail = require('@sendgrid/api-key');

class EmailService {
  constructor() {
    this.transporter = null;
    this.emailProvider = process.env.EMAIL_PROVIDER || 'sendgrid'; // 'sendgrid' or 'smtp'
    this.fromEmail = process.env.FROM_EMAIL || 'noreply@hackmates.com';
    this.setupEmailProvider();
  }

  /**
   * Setup email provider (SendGrid or SMTP)
   */
  setupEmailProvider() {
    if (this.emailProvider === 'sendgrid') {
      if (process.env.SENDGRID_API_KEY) {
        sgMail.setApiKey(process.env.SENDGRID_API_KEY);
        console.log('SendGrid email service initialized');
      } else {
        console.warn('SENDGRID_API_KEY not provided, email service disabled');
      }
    } else {
      // SMTP configuration
      this.transporter = nodemailer.createTransporter({
        host: process.env.SMTP_HOST || 'smtp.gmail.com',
        port: process.env.SMTP_PORT || 587,
        secure: false,
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS
        }
      });
      console.log('SMTP email service initialized');
    }
  }

  /**
   * Send email using configured provider
   * @param {Object} emailData - Email data
   * @returns {Promise<boolean>} Success status
   */
  async sendEmail(emailData) {
    try {
      if (this.emailProvider === 'sendgrid') {
        return await this.sendEmailWithSendGrid(emailData);
      } else {
        return await this.sendEmailWithSMTP(emailData);
      }
    } catch (error) {
      console.error('Email sending failed:', error);
      return false;
    }
  }

  /**
   * Send email using SendGrid
   * @param {Object} emailData - Email data
   * @returns {Promise<boolean>} Success status
   */
  async sendEmailWithSendGrid(emailData) {
    try {
      const msg = {
        to: emailData.to,
        from: emailData.from || this.fromEmail,
        subject: emailData.subject,
        text: emailData.text,
        html: emailData.html
      };

      await sgMail.send(msg);
      console.log(`Email sent to ${emailData.to}`);
      return true;
    } catch (error) {
      console.error('SendGrid email error:', error);
      return false;
    }
  }

  /**
   * Send email using SMTP
   * @param {Object} emailData - Email data
   * @returns {Promise<boolean>} Success status
   */
  async sendEmailWithSMTP(emailData) {
    try {
      if (!this.transporter) {
        console.error('SMTP transporter not configured');
        return false;
      }

      const mailOptions = {
        from: emailData.from || this.fromEmail,
        to: emailData.to,
        subject: emailData.subject,
        text: emailData.text,
        html: emailData.html
      };

      await this.transporter.sendMail(mailOptions);
      console.log(`Email sent to ${emailData.to}`);
      return true;
    } catch (error) {
      console.error('SMTP email error:', error);
      return false;
    }
  }

  /**
   * Send welcome email to new users
   * @param {Object} user - User object
   * @returns {Promise<boolean>} Success status
   */
  async sendWelcomeEmail(user) {
    const emailData = {
      to: user.email,
      subject: 'Welcome to HackMates! 🚀',
      html: this.generateWelcomeEmailHTML(user),
      text: this.generateWelcomeEmailText(user)
    };

    return await this.sendEmail(emailData);
  }

  /**
   * Send email verification
   * @param {Object} user - User object
   * @param {string} verificationToken - Verification token
   * @returns {Promise<boolean>} Success status
   */
  async sendEmailVerification(user, verificationToken) {
    const verificationUrl = `${process.env.FRONTEND_URL}/verify-email?token=${verificationToken}`;
    
    const emailData = {
      to: user.email,
      subject: 'Verify Your Email - HackMates',
      html: this.generateVerificationEmailHTML(user, verificationUrl),
      text: this.generateVerificationEmailText(user, verificationUrl)
    };

    return await this.sendEmail(emailData);
  }

  /**
   * Send password reset email
   * @param {Object} user - User object
   * @param {string} resetToken - Reset token
   * @returns {Promise<boolean>} Success status
   */
  async sendPasswordResetEmail(user, resetToken) {
    const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;
    
    const emailData = {
      to: user.email,
      subject: 'Reset Your Password - HackMates',
      html: this.generatePasswordResetEmailHTML(user, resetUrl),
      text: this.generatePasswordResetEmailText(user, resetUrl)
    };

    return await this.sendEmail(emailData);
  }

  /**
   * Send team invitation email
   * @param {Object} fromUser - User sending invitation
   * @param {Object} toUser - User receiving invitation
   * @param {Object} team - Team object
   * @param {Object} hackathon - Hackathon object
   * @returns {Promise<boolean>} Success status
   */
  async sendTeamInvitation(fromUser, toUser, team, hackathon) {
    const emailData = {
      to: toUser.email,
      subject: `Team Invitation for ${hackathon.title} - HackMates`,
      html: this.generateTeamInvitationEmailHTML(fromUser, toUser, team, hackathon),
      text: this.generateTeamInvitationEmailText(fromUser, toUser, team, hackathon)
    };

    return await this.sendEmail(emailData);
  }

  /**
   * Send teammate request notification
   * @param {Object} fromUser - User sending request
   * @param {Object} toUser - User receiving request
   * @param {Object} hackathon - Hackathon object
   * @param {string} message - Personal message
   * @returns {Promise<boolean>} Success status
   */
  async sendTeammateRequest(fromUser, toUser, hackathon, message) {
    const emailData = {
      to: toUser.email,
      subject: `Teammate Request for ${hackathon.title} - HackMates`,
      html: this.generateTeammateRequestEmailHTML(fromUser, toUser, hackathon, message),
      text: this.generateTeammateRequestEmailText(fromUser, toUser, hackathon, message)
    };

    return await this.sendEmail(emailData);
  }

  /**
   * Send hackathon reminder email
   * @param {Object} user - User object
   * @param {Object} hackathon - Hackathon object
   * @param {string} reminderType - 'registration_closing', 'starting_soon', 'ending_soon'
   * @returns {Promise<boolean>} Success status
   */
  async sendHackathonReminder(user, hackathon, reminderType) {
    let subject, html, text;

    switch (reminderType) {
      case 'registration_closing':
        subject = `Registration Closing Soon: ${hackathon.title}`;
        html = this.generateRegistrationReminderEmailHTML(user, hackathon);
        text = this.generateRegistrationReminderEmailText(user, hackathon);
        break;
      case 'starting_soon':
        subject = `Starting Tomorrow: ${hackathon.title}`;
        html = this.generateStartingReminderEmailHTML(user, hackathon);
        text = this.generateStartingReminderEmailText(user, hackathon);
        break;
      case 'ending_soon':
        subject = `Ending Soon: ${hackathon.title}`;
        html = this.generateEndingReminderEmailHTML(user, hackathon);
        text = this.generateEndingReminderEmailText(user, hackathon);
        break;
      default:
        return false;
    }

    const emailData = { to: user.email, subject, html, text };
    return await this.sendEmail(emailData);
  }

  // HTML Email Templates

  /**
   * Generate welcome email HTML
   * @param {Object} user - User object
   * @returns {string} HTML content
   */
  generateWelcomeEmailHTML(user) {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Welcome to HackMates</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .button { display: inline-block; padding: 12px 30px; background: #667eea; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🚀 Welcome to HackMates!</h1>
          </div>
          <div class="content">
            <h2>Hi ${user.firstName}!</h2>
            <p>Welcome to HackMates - the ultimate platform for finding your perfect hackathon teammates!</p>
            
            <p>Here's what you can do now:</p>
            <ul>
              <li>✅ Complete your profile to get better matches</li>
              <li>🔍 Browse upcoming hackathons</li>
              <li>🤝 Connect with like-minded developers</li>
              <li>🏆 Form winning teams with AI-powered matching</li>
            </ul>

            <a href="${process.env.FRONTEND_URL}/profile" class="button">Complete Your Profile</a>

            <p>Need help getting started? Check out our <a href="${process.env.FRONTEND_URL}/guide">Getting Started Guide</a>.</p>
            
            <p>Happy hacking!</p>
            <p>The HackMates Team</p>
          </div>
          <div class="footer">
            <p>Questions? Reply to this email or contact us at support@hackmates.com</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  /**
   * Generate verification email HTML
   * @param {Object} user - User object
   * @param {string} verificationUrl - Verification URL
   * @returns {string} HTML content
   */
  generateVerificationEmailHTML(user, verificationUrl) {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Verify Your Email</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #4CAF50; color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .button { display: inline-block; padding: 12px 30px; background: #4CAF50; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>📧 Verify Your Email</h1>
          </div>
          <div class="content">
            <h2>Hi ${user.firstName}!</h2>
            <p>Thanks for signing up with HackMates! To complete your registration, please verify your email address.</p>
            
            <a href="${verificationUrl}" class="button">Verify Email Address</a>
            
            <p>If the button doesn't work, you can also copy and paste this link into your browser:</p>
            <p style="word-break: break-all; color: #666;">${verificationUrl}</p>
            
            <p>This verification link will expire in 24 hours.</p>
            
            <p>If you didn't create an account with HackMates, you can safely ignore this email.</p>
            
            <p>Best regards,<br>The HackMates Team</p>
          </div>
          <div class="footer">
            <p>Need help? Contact us at support@hackmates.com</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  /**
   * Generate team invitation email HTML
   * @param {Object} fromUser - User sending invitation
   * @param {Object} toUser - User receiving invitation
   * @param {Object} team - Team object
   * @param {Object} hackathon - Hackathon object
   * @returns {string} HTML content
   */
  generateTeamInvitationEmailHTML(fromUser, toUser, team, hackathon) {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Team Invitation</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #FF6B6B 0%, #4ECDC4 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .team-info { background: white; padding: 20px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #4ECDC4; }
          .button { display: inline-block; padding: 12px 30px; background: #4ECDC4; color: white; text-decoration: none; border-radius: 5px; margin: 10px 5px; }
          .button.decline { background: #FF6B6B; }
          .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🤝 Team Invitation</h1>
          </div>
          <div class="content">
            <h2>Hi ${toUser.firstName}!</h2>
            <p>${fromUser.firstName} ${fromUser.lastName} has invited you to join their team for <strong>${hackathon.title}</strong>!</p>
            
            <div class="team-info">
              <h3>Team: ${team.name}</h3>
              <p><strong>Description:</strong> ${team.description}</p>
              <p><strong>Hackathon:</strong> ${hackathon.title}</p>
              <p><strong>Start Date:</strong> ${new Date(hackathon.startDate).toLocaleDateString()}</p>
              <p><strong>Required Skills:</strong> ${team.requiredSkills.join(', ')}</p>
            </div>
            
            <div style="text-align: center;">
              <a href="${process.env.FRONTEND_URL}/teams/invitation/${team._id}/accept" class="button">Accept Invitation</a>
              <a href="${process.env.FRONTEND_URL}/teams/invitation/${team._id}/decline" class="button decline">Decline</a>
            </div>
            
            <p>You can also view the full team details and respond to the invitation by logging into your HackMates account.</p>
            
            <p>Good luck with the hackathon!</p>
            <p>The HackMates Team</p>
          </div>
          <div class="footer">
            <p>Questions? Contact us at support@hackmates.com</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  // Text Email Templates (fallback for HTML)

  generateWelcomeEmailText(user) {
    return `
      Welcome to HackMates, ${user.firstName}!

      Welcome to HackMates - the ultimate platform for finding your perfect hackathon teammates!

      Here's what you can do now:
      - Complete your profile to get better matches
      - Browse upcoming hackathons
      - Connect with like-minded developers
      - Form winning teams with AI-powered matching

      Complete your profile: ${process.env.FRONTEND_URL}/profile

      Need help? Check out our Getting Started Guide: ${process.env.FRONTEND_URL}/guide

      Happy hacking!
      The HackMates Team

      Questions? Reply to this email or contact us at support@hackmates.com
    `;
  }

  generateVerificationEmailText(user, verificationUrl) {
    return `
      Hi ${user.firstName}!

      Thanks for signing up with HackMates! To complete your registration, please verify your email address.

      Click here to verify: ${verificationUrl}

      This verification link will expire in 24 hours.

      If you didn't create an account with HackMates, you can safely ignore this email.

      Best regards,
      The HackMates Team
    `;
  }

  generateTeamInvitationEmailText(fromUser, toUser, team, hackathon) {
    return `
      Hi ${toUser.firstName}!

      ${fromUser.firstName} ${fromUser.lastName} has invited you to join their team for ${hackathon.title}!

      Team: ${team.name}
      Description: ${team.description}
      Hackathon: ${hackathon.title}
      Start Date: ${new Date(hackathon.startDate).toLocaleDateString()}
      Required Skills: ${team.requiredSkills.join(', ')}

      Accept invitation: ${process.env.FRONTEND_URL}/teams/invitation/${team._id}/accept
      Decline invitation: ${process.env.FRONTEND_URL}/teams/invitation/${team._id}/decline

      You can also view the full team details by logging into your HackMates account.

      Good luck with the hackathon!
      The HackMates Team
    `;
  }

  generateTeammateRequestEmailText(fromUser, toUser, hackathon, message) {
    return `
      Hi ${toUser.firstName}!

      ${fromUser.firstName} ${fromUser.lastName} wants to team up with you for ${hackathon.title}!

      Message: ${message}

      Hackathon: ${hackathon.title}
      Start Date: ${new Date(hackathon.startDate).toLocaleDateString()}

      View their profile and respond: ${process.env.FRONTEND_URL}/requests

      The HackMates Team
    `;
  }

  generateRegistrationReminderEmailText(user, hackathon) {
    return `
      Hi ${user.firstName}!

      Registration for ${hackathon.title} is closing soon!

      Registration Deadline: ${new Date(hackathon.registrationDeadline).toLocaleDateString()}
      Hackathon Start: ${new Date(hackathon.startDate).toLocaleDateString()}

      Don't miss out - register now: ${hackathon.registrationUrl}

      The HackMates Team
    `;
  }

  generateStartingReminderEmailText(user, hackathon) {
    return `
      Hi ${user.firstName}!

      ${hackathon.title} starts tomorrow!

      Start Date: ${new Date(hackathon.startDate).toLocaleDateString()}
      End Date: ${new Date(hackathon.endDate).toLocaleDateString()}

      Make sure you're ready and have your team assembled. Good luck!

      The HackMates Team
    `;
  }

  generateEndingReminderEmailText(user, hackathon) {
    return `
      Hi ${user.firstName}!

      ${hackathon.title} is ending soon!

      End Date: ${new Date(hackathon.endDate).toLocaleDateString()}

      Make sure to submit your project before the deadline. Good luck!

      The HackMates Team
    `;
  }
}

module.exports = new EmailService();