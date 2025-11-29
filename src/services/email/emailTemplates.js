/**
 * Email Templates
 *
 * Centralized email template generation for all email types.
 * Each template function returns { subject, html, text } for use with email providers.
 */

/**
 * Base email HTML wrapper
 *
 * Provides consistent styling and structure for all emails
 */
function wrapEmailHtml(content) {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Design Token Manager</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      background-color: #f5f5f5;
      margin: 0;
      padding: 0;
    }
    .container {
      max-width: 600px;
      margin: 40px auto;
      background-color: #ffffff;
      border-radius: 8px;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
      overflow: hidden;
    }
    .header {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: #ffffff;
      padding: 30px;
      text-align: center;
    }
    .header h1 {
      margin: 0;
      font-size: 24px;
      font-weight: 600;
    }
    .content {
      padding: 40px 30px;
    }
    .button {
      display: inline-block;
      padding: 14px 28px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: #ffffff;
      text-decoration: none;
      border-radius: 6px;
      font-weight: 600;
      margin: 20px 0;
    }
    .footer {
      background-color: #f9f9f9;
      padding: 20px 30px;
      text-align: center;
      font-size: 14px;
      color: #666;
      border-top: 1px solid #eeeeee;
    }
    .footer a {
      color: #667eea;
      text-decoration: none;
    }
    p {
      margin: 16px 0;
    }
    .warning {
      background-color: #fff3cd;
      border-left: 4px solid #ffc107;
      padding: 12px 16px;
      margin: 20px 0;
      border-radius: 4px;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🎨 Design Token Manager</h1>
    </div>
    <div class="content">
      ${content}
    </div>
    <div class="footer">
      <p>Design Token Manager - Multi-tenant Design System Platform</p>
      <p>Questions? Contact <a href="mailto:support@designtokens.local">support@designtokens.local</a></p>
    </div>
  </div>
</body>
</html>
  `;
}

/**
 * Tenant Admin Invitation Email
 *
 * Sent when a new tenant is created and admin needs to set up their account.
 *
 * @param {Object} params - Template parameters
 * @param {string} params.adminName - Name of the admin being invited
 * @param {string} params.tenantName - Name of the tenant organization
 * @param {string} params.invitationLink - Full URL to accept invitation
 * @param {string} params.expiresIn - Human-readable expiration time (e.g., "72 hours")
 * @returns {Object} { subject, html, text }
 */
export function tenantAdminInvitationEmail({ adminName, tenantName, invitationLink, expiresIn = '72 hours' }) {
  const subject = `You're invited to set up ${tenantName} on Design Token Manager`;

  const html = wrapEmailHtml(`
    <h2>Welcome, ${adminName}! 👋</h2>

    <p>You've been invited to set up a new organization on Design Token Manager:</p>

    <p><strong>${tenantName}</strong></p>

    <p>As the administrator, you'll have full control over your organization's design tokens, team members, and projects.</p>

    <p style="text-align: center;">
      <a href="${invitationLink}" class="button">Accept Invitation &amp; Set Up Account</a>
    </p>

    <div class="warning">
      ⏰ <strong>Important:</strong> This invitation link expires in ${expiresIn}. Please complete your account setup before then.
    </div>

    <p>What you can do with Design Token Manager:</p>
    <ul>
      <li>Manage design tokens across multiple projects</li>
      <li>Invite team members and assign roles</li>
      <li>Export tokens in various formats</li>
      <li>Track token changes and versions</li>
    </ul>

    <p>If you have any questions, feel free to reach out to our support team.</p>

    <p>Best regards,<br>The Design Token Manager Team</p>
  `);

  const text = `
Welcome, ${adminName}!

You've been invited to set up a new organization on Design Token Manager:
${tenantName}

As the administrator, you'll have full control over your organization's design tokens, team members, and projects.

Accept your invitation and set up your account:
${invitationLink}

IMPORTANT: This invitation link expires in ${expiresIn}. Please complete your account setup before then.

What you can do with Design Token Manager:
- Manage design tokens across multiple projects
- Invite team members and assign roles
- Export tokens in various formats
- Track token changes and versions

If you have any questions, feel free to reach out to our support team.

Best regards,
The Design Token Manager Team
  `.trim();

  return { subject, html, text };
}

/**
 * Team Member Invitation Email
 *
 * Sent when an existing tenant admin invites a new team member.
 *
 * @param {Object} params - Template parameters
 * @param {string} params.memberName - Name of the member being invited
 * @param {string} params.tenantName - Name of the tenant organization
 * @param {string} params.inviterName - Name of person sending invitation
 * @param {string} params.role - Role being granted (admin, editor, viewer)
 * @param {string} params.invitationLink - Full URL to accept invitation
 * @param {string} params.expiresIn - Human-readable expiration time
 * @returns {Object} { subject, html, text }
 */
export function teamMemberInvitationEmail({ memberName, tenantName, inviterName, role, invitationLink, expiresIn = '72 hours' }) {
  const subject = `${inviterName} invited you to join ${tenantName} on Design Token Manager`;

  const roleDescriptions = {
    admin: 'full administrative access',
    editor: 'create and edit design tokens',
    viewer: 'view design tokens'
  };

  const roleDescription = roleDescriptions[role] || 'access to';

  const html = wrapEmailHtml(`
    <h2>You've been invited! 🎉</h2>

    <p>Hi ${memberName},</p>

    <p><strong>${inviterName}</strong> has invited you to join <strong>${tenantName}</strong> on Design Token Manager.</p>

    <p>You'll have <strong>${role}</strong> access, allowing you to ${roleDescription}.</p>

    <p style="text-align: center;">
      <a href="${invitationLink}" class="button">Accept Invitation</a>
    </p>

    <div class="warning">
      ⏰ This invitation expires in ${expiresIn}.
    </div>

    <p>Once you accept, you'll be able to collaborate with the team on managing design tokens for your organization's projects.</p>

    <p>If you weren't expecting this invitation, you can safely ignore this email.</p>

    <p>Best regards,<br>The Design Token Manager Team</p>
  `);

  const text = `
You've been invited!

Hi ${memberName},

${inviterName} has invited you to join ${tenantName} on Design Token Manager.

You'll have ${role} access, allowing you to ${roleDescription}.

Accept your invitation:
${invitationLink}

This invitation expires in ${expiresIn}.

Once you accept, you'll be able to collaborate with the team on managing design tokens for your organization's projects.

If you weren't expecting this invitation, you can safely ignore this email.

Best regards,
The Design Token Manager Team
  `.trim();

  return { subject, html, text };
}

/**
 * Password Reset Email
 *
 * Sent when user requests to reset their password.
 *
 * @param {Object} params - Template parameters
 * @param {string} params.userName - Name of the user
 * @param {string} params.resetLink - Full URL to reset password
 * @param {string} params.expiresIn - Human-readable expiration time
 * @returns {Object} { subject, html, text }
 */
export function passwordResetEmail({ userName, resetLink, expiresIn = '1 hour' }) {
  const subject = 'Reset your Design Token Manager password';

  const html = wrapEmailHtml(`
    <h2>Password Reset Request 🔒</h2>

    <p>Hi ${userName},</p>

    <p>We received a request to reset your password for Design Token Manager.</p>

    <p style="text-align: center;">
      <a href="${resetLink}" class="button">Reset Password</a>
    </p>

    <div class="warning">
      ⏰ This link expires in ${expiresIn} for security reasons.
    </div>

    <p>If you didn't request a password reset, you can safely ignore this email. Your password will remain unchanged.</p>

    <p>For security reasons, never share your password reset link with anyone.</p>

    <p>Best regards,<br>The Design Token Manager Team</p>
  `);

  const text = `
Password Reset Request

Hi ${userName},

We received a request to reset your password for Design Token Manager.

Reset your password:
${resetLink}

This link expires in ${expiresIn} for security reasons.

If you didn't request a password reset, you can safely ignore this email. Your password will remain unchanged.

For security reasons, never share your password reset link with anyone.

Best regards,
The Design Token Manager Team
  `.trim();

  return { subject, html, text };
}
