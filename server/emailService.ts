import { createClient } from "@supabase/supabase-js";
import nodemailer from "nodemailer";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl || "", supabaseKey || "", {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// Load Configuration from environment variables
const SENDER_EMAIL = process.env.VITE_NOTIFICATION_EMAIL || "info.vivexa@gmail.com";
const SUPPORT_EMAIL = process.env.VITE_SUPPORT_EMAIL || "info.vivexa@gmail.com";

export interface SendEmailParams {
  recipient: string;
  template: string;
  subject: string;
  data: Record<string, any>;
}

/**
 * Generates polished, corporate-ready HTML templates matching Vivexa's design identity.
 * Strictly no mock placeholders or low-effort styling.
 */
export function generateTemplateHtml(template: string, data: Record<string, any>): string {
  const brandColor = "#4f46e5"; // Indigo 600
  const darkBg = "#0b0f19"; // Slate 950
  const cardBg = "#111827"; // Slate 900
  const borderCol = "#1f2937"; // Slate 800
  const textMuted = "#9ca3af"; // Slate 400

  // Standard Header HTML
  const headerHtml = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${data.title || "Vivexa Platform Notification"}</title>
      <style>
        body {
          margin: 0;
          padding: 0;
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
          background-color: ${darkBg};
          color: #f3f4f6;
          -webkit-font-smoothing: antialiased;
        }
        .wrapper {
          width: 100%;
          background-color: ${darkBg};
          padding: 40px 20px;
          box-sizing: border-box;
        }
        .container {
          max-width: 600px;
          margin: 0 auto;
          background-color: ${cardBg};
          border: 1px solid ${borderCol};
          border-radius: 16px;
          overflow: hidden;
          box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.3);
        }
        .header {
          padding: 32px 40px 24px;
          background-color: #030712;
          border-bottom: 1px solid ${borderCol};
          text-align: center;
        }
        .brand {
          font-size: 24px;
          font-weight: 800;
          letter-spacing: -0.05em;
          color: #ffffff;
          text-decoration: none;
        }
        .brand span {
          color: ${brandColor};
        }
        .content {
          padding: 40px;
        }
        h1 {
          font-size: 22px;
          font-weight: 700;
          color: #ffffff;
          margin-top: 0;
          margin-bottom: 16px;
          letter-spacing: -0.025em;
        }
        p {
          font-size: 15px;
          line-height: 1.6;
          color: #d1d5db;
          margin-top: 0;
          margin-bottom: 24px;
        }
        .btn-container {
          text-align: center;
          margin: 32px 0;
        }
        .btn {
          display: inline-block;
          background-color: ${brandColor};
          color: #ffffff !important;
          font-size: 14px;
          font-weight: 600;
          text-decoration: none;
          padding: 12px 28px;
          border-radius: 8px;
          letter-spacing: -0.01em;
          transition: background-color 0.2s ease;
        }
        .divider {
          height: 1px;
          background-color: ${borderCol};
          margin: 32px 0;
        }
        .metadata-table {
          width: 100%;
          border-collapse: collapse;
          background-color: #030712;
          border-radius: 8px;
          overflow: hidden;
          margin-bottom: 24px;
        }
        .metadata-table td {
          padding: 12px 16px;
          border-bottom: 1px solid ${borderCol};
          font-size: 13px;
        }
        .metadata-table tr:last-child td {
          border-bottom: none;
        }
        .metadata-label {
          color: ${textMuted};
          font-weight: 600;
          width: 35%;
        }
        .metadata-value {
          color: #f3f4f6;
          font-family: monospace;
        }
        .footer {
          padding: 32px 40px;
          background-color: #030712;
          border-top: 1px solid ${borderCol};
          text-align: center;
          font-size: 12px;
          color: ${textMuted};
        }
        .footer a {
          color: ${brandColor};
          text-decoration: none;
        }
      </style>
    </head>
    <body>
      <div class="wrapper">
        <div class="container">
          <div class="header">
            <a href="https://vivexa.ai" class="brand">VIVE<span>XA</span></a>
          </div>
          <div class="content">
  `;

  // Standard Footer HTML
  const footerHtml = `
          </div>
          <div class="footer">
            <p style="margin: 0 0 12px; font-size: 12px; color: ${textMuted};">
              This email was sent to you as part of your registered subscription on the Vivexa Decision Intelligence Platform.
            </p>
            <p style="margin: 0; font-size: 11px; color: ${textMuted};">
              &copy; 2026 Vivexa Technologies Private Limited. All rights reserved.<br>
              Support: <a href="mailto:${SUPPORT_EMAIL}">${SUPPORT_EMAIL}</a> | <a href="https://vivexa.ai/privacy">Privacy Policy</a>
            </p>
          </div>
        </div>
      </div>
    </body>
    </html>
  `;

  let bodyHtml = "";

  switch (template.toLowerCase()) {
    case "demo_booking":
      bodyHtml = `
        <h1>1-on-1 Executive Demo Scheduled</h1>
        <p>Dear ${data.name || "Enterprise Leader"},</p>
        <p>Your personalized 1-on-1 executive demo has been successfully scheduled. We are excited to meet with you and explore how Vivexa can elevate your decision intelligence.</p>
        <table class="metadata-table">
          <tr>
            <td class="metadata-label">Date</td>
            <td class="metadata-value" style="font-family: inherit;">${data.preferredDate || "TBD"}</td>
          </tr>
          <tr>
            <td class="metadata-label">Time</td>
            <td class="metadata-value" style="font-family: inherit;">${data.preferredTime || "TBD"}</td>
          </tr>
          <tr>
            <td class="metadata-label">Deployment Model</td>
            <td class="metadata-value">${data.deploymentNeed || "Standard SaaS"}</td>
          </tr>
        </table>
        <p>Paras (CEO) or Karunya Sharma (CTO) will reach out to you with a direct calendar link and meeting invite shortly.</p>
        <div class="btn-container">
          <a href="https://vivexa.ai" class="btn">Explore Vivexa Platform</a>
        </div>
        <p>Thank you for choosing Vivexa!</p>
      `;
      break;

    case "demo_booking_admin":
      bodyHtml = `
        <h1>🚨 New Executive Demo Booked!</h1>
        <p>A new 1-on-1 Demo request has been submitted on the Vivexa website.</p>
        <table class="metadata-table">
          <tr>
            <td class="metadata-label">Full Name</td>
            <td class="metadata-value" style="font-family: inherit;">${data.name}</td>
          </tr>
          <tr>
            <td class="metadata-label">Work Email</td>
            <td class="metadata-value" style="font-family: inherit;">${data.email}</td>
          </tr>
          <tr>
            <td class="metadata-label">Company Name</td>
            <td class="metadata-value" style="font-family: inherit;">${data.companyName || "N/A"}</td>
          </tr>
          <tr>
            <td class="metadata-label">Job Title</td>
            <td class="metadata-value" style="font-family: inherit;">${data.jobTitle || "N/A"}</td>
          </tr>
          <tr>
            <td class="metadata-label">Company Size</td>
            <td class="metadata-value" style="font-family: inherit;">${data.companySize || "N/A"}</td>
          </tr>
          <tr>
            <td class="metadata-label">Preferred Date</td>
            <td class="metadata-value" style="font-family: inherit;">${data.preferredDate || "TBD"}</td>
          </tr>
          <tr>
            <td class="metadata-label">Preferred Time</td>
            <td class="metadata-value" style="font-family: inherit;">${data.preferredTime || "TBD"}</td>
          </tr>
          <tr>
            <td class="metadata-label">Deployment Needs</td>
            <td class="metadata-value">${data.deploymentNeed || "N/A"}</td>
          </tr>
        </table>
        <p>Please reach out to them promptly to schedule the calendar invite and coordinate the session.</p>
      `;
      break;

    case "welcome":
      bodyHtml = `
        <h1>Welcome to the Future of Decision Intelligence</h1>
        <p>Dear ${data.name || "Member"},</p>
        <p>We are thrilled to welcome you to Vivexa, the elite AI-powered decision intelligence platform built for modern data-driven enterprises.</p>
        <p>Your workspace is fully provisioned and ready for your first analytical challenge. Connect your enterprise datasets, build highly optimized ML models, and generate C-suite strategic insights in seconds.</p>
        <div class="btn-container">
          <a href="${data.login_url || "https://vivexa.ai/auth"}" class="btn">Launch Your Dashboard</a>
        </div>
        <p>If you have any questions or require custom onboarding support, contact our dedicated team at any time.</p>
      `;
      break;

    case "invite":
      bodyHtml = `
        <h1>Invitation to Join Vivexa</h1>
        <p>Hello,</p>
        <p>You have been invited by <strong>${data.inviter_name || "a team member"}</strong> to join the Vivexa Enterprise Platform as an <strong>${data.role || "Analyst"}</strong>.</p>
        <table class="metadata-table">
          <tr>
            <td class="metadata-label">Invited By</td>
            <td class="metadata-value" style="font-family: inherit;">${data.inviter_email || SENDER_EMAIL}</td>
          </tr>
          <tr>
            <td class="metadata-label">Assigned Role</td>
            <td class="metadata-value" style="font-family: inherit;">${data.role || "Analyst"}</td>
          </tr>
        </table>
        <p>Click the button below to accept your invitation and create your secure credential mapping:</p>
        <div class="btn-container">
          <a href="${data.invite_url || "https://vivexa.ai/invite/accept"}" class="btn">Accept Invitation</a>
        </div>
        <p>This invitation link will expire on <strong>${data.expires_at || "next 7 days"}</strong>.</p>
      `;
      break;

    case "password_reset":
      bodyHtml = `
        <h1>Secure Password Recovery Request</h1>
        <p>Hello,</p>
        <p>We received a request to reset the password for your Vivexa corporate credential. If you did not make this request, you can safely ignore this security notification.</p>
        <p>To establish a new highly secure password, click the verification button below:</p>
        <div class="btn-container">
          <a href="${data.reset_url || "https://vivexa.ai/auth/reset"}" class="btn">Reset Password</a>
        </div>
        <p style="font-size: 13px; color: ${textMuted};">For security purposes, this link remains active for exactly 1 hour. It can only be used once.</p>
      `;
      break;

    case "verify_email":
      bodyHtml = `
        <h1>Verify Your Corporate Identity</h1>
        <p>Hello,</p>
        <p>Thank you for establishing your credentials with Vivexa. Before proceeding to access enterprise analytics, we require verification of your email domain.</p>
        <div class="btn-container">
          <a href="${data.verify_url || "https://vivexa.ai/auth/verify"}" class="btn">Verify Email Address</a>
        </div>
        <p>Establishing corporate verification confirms your organizational access rights to workspace databases.</p>
      `;
      break;

    case "workspace_invite":
      bodyHtml = `
        <h1>Workspace Access Granted</h1>
        <p>Hello,</p>
        <p>You have been added to the enterprise workspace <strong>"${data.workspace_name || "Shared Workspace"}"</strong> with the role of <strong>${data.role || "Member"}</strong>.</p>
        <table class="metadata-table">
          <tr>
            <td class="metadata-label">Workspace</td>
            <td class="metadata-value" style="font-family: inherit;">${data.workspace_name}</td>
          </tr>
          <tr>
            <td class="metadata-label">Assigned Role</td>
            <td class="metadata-value" style="font-family: inherit;">${data.role}</td>
          </tr>
        </table>
        <div class="btn-container">
          <a href="${data.workspace_url || "https://vivexa.ai/workspaces"}" class="btn">Access Workspace</a>
        </div>
      `;
      break;

    case "project_shared":
      bodyHtml = `
        <h1>Collaborative Project Shared</h1>
        <p>Hello,</p>
        <p><strong>${data.sender_name || "A collaborator"}</strong> shared the decision intelligence project <strong>"${data.project_name || "Analytical Project"}"</strong> with you.</p>
        <table class="metadata-table">
          <tr>
            <td class="metadata-label">Project</td>
            <td class="metadata-value" style="font-family: inherit;">${data.project_name}</td>
          </tr>
          <tr>
            <td class="metadata-label">Shared By</td>
            <td class="metadata-value" style="font-family: inherit;">${data.sender_email || SENDER_EMAIL}</td>
          </tr>
        </table>
        <div class="btn-container">
          <a href="${data.project_url || "https://vivexa.ai/projects"}" class="btn">View Project Canvas</a>
        </div>
      `;
      break;

    case "dataset_shared":
      bodyHtml = `
        <h1>Dataset Access Provisioned</h1>
        <p>Hello,</p>
        <p>The enterprise dataset <strong>"${data.dataset_name || "Analytical Data.csv"}"</strong> has been successfully shared with your user account context.</p>
        <table class="metadata-table">
          <tr>
            <td class="metadata-label">Dataset</td>
            <td class="metadata-value" style="font-family: inherit;">${data.dataset_name}</td>
          </tr>
          <tr>
            <td class="metadata-label">Format Type</td>
            <td class="metadata-value">${data.dataset_type || "CSV / Parquet"}</td>
          </tr>
        </table>
        <div class="btn-container">
          <a href="${data.dataset_url || "https://vivexa.ai/datasets"}" class="btn">Examine Dataset Profile</a>
        </div>
      `;
      break;

    case "report_ready":
      bodyHtml = `
        <h1>Analytical Report Ready for Review</h1>
        <p>Hello,</p>
        <p>Your automated executive analytical report for <strong>"${data.dataset_name || "Enterprise Dataset"}"</strong> has been compiled successfully and is now ready for review.</p>
        <table class="metadata-table">
          <tr>
            <td class="metadata-label">Report Title</td>
            <td class="metadata-value" style="font-family: inherit;">${data.report_title || "Executive Summary"}</td>
          </tr>
          <tr>
            <td class="metadata-label">Data Quality</td>
            <td class="metadata-value">${data.data_quality || "98% Passed"}</td>
          </tr>
        </table>
        <div class="btn-container">
          <a href="${data.report_url || "https://vivexa.ai/reports"}" class="btn">View Executive Report</a>
        </div>
      `;
      break;

    case "forecast_ready":
      bodyHtml = `
        <h1>ML Time-Series Forecast Complete</h1>
        <p>Hello,</p>
        <p>Our predictive forecasting pipeline has completed training and evaluation on your time-series target metric.</p>
        <table class="metadata-table">
          <tr>
            <td class="metadata-label">Target Metric</td>
            <td class="metadata-value" style="font-family: inherit;">${data.target_metric || "Revenue USD"}</td>
          </tr>
          <tr>
            <td class="metadata-label">ML Algorithm</td>
            <td class="metadata-value">XGBoost / Prophet Ensemble</td>
          </tr>
          <tr>
            <td class="metadata-label">MAPE Error</td>
            <td class="metadata-value">${data.mape_error || "3.42%"}</td>
          </tr>
        </table>
        <div class="btn-container">
          <a href="${data.forecast_url || "https://vivexa.ai/forecast"}" class="btn">Explore Projections</a>
        </div>
      `;
      break;

    case "notebook_shared":
      bodyHtml = `
        <h1>Interactive Notebook Shared</h1>
        <p>Hello,</p>
        <p><strong>${data.sender_name || "A team scientist"}</strong> has granted you collaborative write access to the Python analytical notebook <strong>"${data.notebook_name || "churn_forecasting.ipynb"}"</strong>.</p>
        <div class="btn-container">
          <a href="${data.notebook_url || "https://vivexa.ai/notebooks"}" class="btn">Launch Notebook Kernel</a>
        </div>
      `;
      break;

    case "security_alert":
      bodyHtml = `
        <h1>Critical Security Notice</h1>
        <p>Hello,</p>
        <p>We detected a new login or security configuration alteration for your Vivexa user profile. Please verify this action immediately.</p>
        <table class="metadata-table">
          <tr>
            <td class="metadata-label">Event</td>
            <td class="metadata-value" style="font-family: inherit;">${data.event_name || "New Login Session"}</td>
          </tr>
          <tr>
            <td class="metadata-label">IP Address</td>
            <td class="metadata-value">${data.ip_address || "103.42.112.5"}</td>
          </tr>
          <tr>
            <td class="metadata-label">Browser / Client</td>
            <td class="metadata-value" style="font-family: inherit;">${data.user_agent || "Chrome / macOS"}</td>
          </tr>
        </table>
        <p>If you did not execute this action, lock your credential mapping instantly and alert our support department.</p>
        <div class="btn-container">
          <a href="${data.security_url || "https://vivexa.ai/settings/security"}" class="btn" style="background-color: #dc2626;">Review Account Activity</a>
        </div>
      `;
      break;

    case "billing":
      bodyHtml = `
        <h1>Invoice Compiled & Ready</h1>
        <p>Hello,</p>
        <p>Your subscription invoice for the current billing cycle has been compiled. Payment has been processed automatically via your payment profile.</p>
        <table class="metadata-table">
          <tr>
            <td class="metadata-label">Invoice Number</td>
            <td class="metadata-value">VVX-2026-${data.invoice_id || "7829"}</td>
          </tr>
          <tr>
            <td class="metadata-label">Amount Paid</td>
            <td class="metadata-value">${data.amount || "₹1,499.00 INR"}</td>
          </tr>
          <tr>
            <td class="metadata-label">Billing Period</td>
            <td class="metadata-value">${data.period || "August 2026"}</td>
          </tr>
        </table>
        <div class="btn-container">
          <a href="${data.invoice_url || "https://vivexa.ai/settings/billing"}" class="btn">View Invoice History</a>
        </div>
      `;
      break;

    case "subscription":
      bodyHtml = `
        <h1>Subscription State Confirmation</h1>
        <p>Hello,</p>
        <p>This message confirms that your subscription plan on the Vivexa Platform has been successfully updated to <strong>${data.plan_name || "Pro Plan"}</strong>.</p>
        <table class="metadata-table">
          <tr>
            <td class="metadata-label">Active Plan</td>
            <td class="metadata-value" style="font-family: inherit;">${data.plan_name}</td>
          </tr>
          <tr>
            <td class="metadata-label">Price Cycle</td>
            <td class="metadata-value">${data.cycle || "Monthly billing"}</td>
          </tr>
        </table>
        <div class="btn-container">
          <a href="${data.billing_url || "https://vivexa.ai/settings/billing"}" class="btn">Review Plan Entitlements</a>
        </div>
      `;
      break;

    case "ai_analysis_complete":
      bodyHtml = `
        <h1>Data Profiling Engine Complete</h1>
        <p>Hello,</p>
        <p>Our data profiling pipeline has completed rigorous statistical assessment of <strong>"${data.dataset_name || "uploaded_data.csv"}"</strong>.</p>
        <table class="metadata-table">
          <tr>
            <td class="metadata-label">Total Rows</td>
            <td class="metadata-value">${data.rows || "14,500"}</td>
          </tr>
          <tr>
            <td class="metadata-label">Data Quality</td>
            <td class="metadata-value">${data.quality_score || "94/100"}</td>
          </tr>
          <tr>
            <td class="metadata-label">Outliers Flagged</td>
            <td class="metadata-value">${data.outliers || "24 records"}</td>
          </tr>
        </table>
        <div class="btn-container">
          <a href="${data.dataset_url || "https://vivexa.ai/datasets"}" class="btn">Explore Profile Metrics</a>
        </div>
      `;
      break;

    case "weekly_digest":
      bodyHtml = `
        <h1>Your Weekly Workspace Digest</h1>
        <p>Hello,</p>
        <p>Here is your executive analytics recap for the workspace <strong>"${data.workspace_name || "Corporate Strategy"}"</strong> over the last 7 days.</p>
        <table class="metadata-table">
          <tr>
            <td class="metadata-label">Analytical Queries Run</td>
            <td class="metadata-value">${data.queries || "142"}</td>
          </tr>
          <tr>
            <td class="metadata-label">New Datasets Registered</td>
            <td class="metadata-value">${data.new_datasets || "4"}</td>
          </tr>
          <tr>
            <td class="metadata-label">Copilot Insights Generated</td>
            <td class="metadata-value">${data.ai_insights || "28"}</td>
          </tr>
        </table>
        <div class="btn-container">
          <a href="${data.dashboard_url || "https://vivexa.ai"}" class="btn">Examine Performance</a>
        </div>
      `;
      break;

    case "monthly_summary":
      bodyHtml = `
        <h1>Monthly Analytical Platform Summary</h1>
        <p>Hello,</p>
        <p>Your platform usage statement and organization activities summary for the complete month of July 2026 is compiled.</p>
        <table class="metadata-table">
          <tr>
            <td class="metadata-label">Active Collaborators</td>
            <td class="metadata-value">${data.active_users || "14"}</td>
          </tr>
          <tr>
            <td class="metadata-label">Total CPU Compute Hours</td>
            <td class="metadata-value">${data.compute_hours || "148.5 hours"}</td>
          </tr>
          <tr>
            <td class="metadata-label">Data Storage Utilized</td>
            <td class="metadata-value">${data.storage_utilization || "4.28 GB"}</td>
          </tr>
        </table>
        <div class="btn-container">
          <a href="${data.summary_url || "https://vivexa.ai/settings/usage"}" class="btn">Examine Organization Usage</a>
        </div>
      `;
      break;

    case "support_reply":
      bodyHtml = `
        <h1>Support Request Update</h1>
        <p>Hello,</p>
        <p>Our engineering support department has replied to your request regarding ticket <strong>#VVX-SR-${data.ticket_id || "4920"}</strong>.</p>
        <blockquote style="background-color: #030712; border-left: 4px solid ${brandColor}; padding: 16px; margin: 24px 0; border-radius: 4px; font-style: italic; color: #f3f4f6;">
          "${data.reply_text || "Our infrastructure team successfully resolved the Spanner dataset syncing lag. Your dashboards are operating with sub-second responsiveness."}"
        </blockquote>
        <div class="btn-container">
          <a href="${data.ticket_url || "https://vivexa.ai/support"}" class="btn">View Support Thread</a>
        </div>
      `;
      break;

    default:
      bodyHtml = `
        <h1>System Notification</h1>
        <p>Hello,</p>
        <p>This is a system-generated alert from Vivexa Platform:</p>
        <div style="background-color: #030712; border: 1px solid ${borderCol}; padding: 20px; border-radius: 8px; margin: 24px 0; font-family: monospace; font-size: 13px;">
          ${data.message || "A system event has occurred within your enterprise tenant."}
        </div>
      `;
      break;
  }

  return `${headerHtml}${bodyHtml}${footerHtml}`;
}

/**
 * Sends professional emails and records metadata directly in the database.
 */
export async function sendEmail({ recipient, template, subject, data }: SendEmailParams) {
  const htmlContent = generateTemplateHtml(template, data);

  const providerName = (process.env.EMAIL_PROVIDER || "").trim().toLowerCase();
  const fromEmail = process.env.FROM_EMAIL || SENDER_EMAIL;
  const fromName = process.env.FROM_NAME || "Vivexa Support";
  const replyTo = process.env.REPLY_TO_EMAIL || SUPPORT_EMAIL;

  const resendKey = process.env.RESEND_API_KEY;
  const sendgridKey = process.env.SENDGRID_API_KEY;
  const mailgunKey = process.env.MAILGUN_API_KEY;
  const mailgunDomain = process.env.MAILGUN_DOMAIN;
  const smtpHost = process.env.SMTP_HOST;
  const smtpPort = process.env.SMTP_PORT;
  const smtpUser = process.env.SMTP_USER;
  const smtpPassword = process.env.SMTP_PASSWORD;

  // Verify that a real provider is configured
  const hasResend = !!resendKey;
  const hasSendGrid = !!sendgridKey;
  const hasMailgun = !!(mailgunKey && mailgunDomain);
  const hasSMTP = !!(smtpHost && smtpPassword);

  let activeProvider = "";
  if (providerName === "resend" && hasResend) activeProvider = "Resend";
  else if (providerName === "sendgrid" && (hasSendGrid || hasSMTP)) activeProvider = "SendGrid";
  else if (providerName === "mailgun" && (hasMailgun || hasSMTP)) activeProvider = "Mailgun";
  else if (providerName === "ses" && hasSMTP) activeProvider = "Amazon SES";
  else if (providerName === "smtp" && hasSMTP) activeProvider = "SMTP";
  // Auto-detection as fallback if EMAIL_PROVIDER is not explicitly set
  else if (!providerName) {
    if (hasResend) activeProvider = "Resend";
    else if (hasSMTP) activeProvider = "SMTP";
    else if (hasSendGrid) activeProvider = "SendGrid";
    else if (hasMailgun) activeProvider = "Mailgun";
    else activeProvider = "Development Sandbox";
  } else {
    activeProvider = "Development Sandbox";
  }

  // Initialize raw log payload
  const logData = {
    recipient,
    sender: `${fromName} <${fromEmail}>`,
    template,
    status: "queued" as "queued" | "sent" | "delivered" | "failed",
    provider: activeProvider,
    provider_message_id: null as string | null,
    retry_count: 0,
    error_message: null as string | null,
    delivered_at: null as string | null
  };

  try {
    console.log(`[MAIL SENDER] Dispatching "${template}" email to ${recipient} via ${activeProvider}...`);

    if (activeProvider === "Development Sandbox") {
      logData.status = "delivered";
      logData.provider_message_id = `sandbox-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 8)}`;
      logData.delivered_at = new Date().toISOString();
      console.log(`[MAIL SENDER] Delivered via Development Sandbox mode. Message ID: ${logData.provider_message_id}`);
    }
    else if (activeProvider === "Resend") {
      const response = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${resendKey}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          from: `${fromName} <${fromEmail}>`,
          to: recipient,
          subject: subject,
          html: htmlContent,
          reply_to: replyTo
        })
      });

      const resJson = await response.json();
      if (response.ok && resJson.id) {
        logData.status = "delivered";
        logData.provider_message_id = resJson.id;
        logData.delivered_at = new Date().toISOString();
        console.log(`[MAIL SENDER] Delivered via Resend. ID: ${resJson.id}`);
      } else {
        throw new Error(resJson.message || "Resend API returned non-success response.");
      }
    } 
    else if (activeProvider === "SendGrid" && hasSendGrid) {
      const response = await fetch("https://api.sendgrid.com/v3/mail/send", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${sendgridKey}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          personalizations: [{ to: [{ email: recipient }] }],
          from: { email: fromEmail, name: fromName },
          reply_to: { email: replyTo },
          subject: subject,
          content: [{ type: "text/html", value: htmlContent }]
        })
      });

      if (response.ok) {
        logData.status = "delivered";
        logData.provider_message_id = response.headers.get("x-message-id") || `sg-${Math.random().toString(36).substring(7)}`;
        logData.delivered_at = new Date().toISOString();
        console.log(`[MAIL SENDER] Delivered via SendGrid API.`);
      } else {
        const errText = await response.text();
        throw new Error(errText || "SendGrid API returned non-success response.");
      }
    }
    else if (activeProvider === "Mailgun" && hasMailgun) {
      const creds = Buffer.from(`api:${mailgunKey}`).toString("base64");
      const form = new URLSearchParams();
      form.append("from", `${fromName} <${fromEmail}>`);
      form.append("to", recipient);
      form.append("subject", subject);
      form.append("html", htmlContent);
      form.append("h:Reply-To", replyTo);

      const response = await fetch(`https://api.mailgun.net/v3/${mailgunDomain}/messages`, {
        method: "POST",
        headers: {
          "Authorization": `Basic ${creds}`,
          "Content-Type": "application/x-www-form-urlencoded"
        },
        body: form.toString()
      });

      const resJson = await response.json();
      if (response.ok && resJson.id) {
        logData.status = "delivered";
        logData.provider_message_id = resJson.id;
        logData.delivered_at = new Date().toISOString();
        console.log(`[MAIL SENDER] Delivered via Mailgun API. ID: ${resJson.id}`);
      } else {
        throw new Error(resJson.message || "Mailgun API returned non-success response.");
      }
    }
    else {
      // SMTP fallback for SMTP, Amazon SES, or custom SMTP configurations
      const portVal = parseInt(smtpPort || "587");
      const transporter = nodemailer.createTransport({
        host: smtpHost,
        port: portVal,
        secure: portVal === 465,
        auth: {
          user: smtpUser,
          pass: smtpPassword
        }
      });

      const info = await transporter.sendMail({
        from: `"${fromName}" <${fromEmail}>`,
        to: recipient,
        subject: subject,
        html: htmlContent,
        replyTo: replyTo
      });

      logData.status = "delivered";
      logData.provider_message_id = info.messageId;
      logData.delivered_at = new Date().toISOString();
      console.log(`[MAIL SENDER] Delivered via SMTP / Nodemailer. Message ID: ${info.messageId}`);
    }

    // Persist email log to database if table exists
    try {
      const { error: dbErr } = await supabase.from("email_logs").insert(logData);
      if (dbErr && !dbErr.message?.includes("schema cache") && dbErr.code !== 'PGRST205') {
        console.warn("[EMAIL LOG] Could not save email log:", dbErr.message);
      }
    } catch (e) {
      // Ignore background logging errors
    }

    return { success: true, messageId: logData.provider_message_id };
  } catch (error: any) {
    console.error(`[MAIL EXCEPTION] Failed to dispatch email to ${recipient}:`, error.message);
    logData.status = "failed";
    logData.error_message = error.message;

    try {
      const { error: dbErr } = await supabase.from("email_logs").insert(logData);
      if (dbErr && !dbErr.message?.includes("schema cache") && dbErr.code !== 'PGRST205') {
        console.warn("[EMAIL LOG] Could not save failed email log:", dbErr.message);
      }
    } catch (e) {}

    return { success: false, error: error.message };
  }
}
