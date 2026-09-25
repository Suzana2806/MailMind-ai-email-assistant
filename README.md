# MailMind — AI Email Assistant

> An AI-powered Gmail assistant that helps users understand emails faster, identify important information, and generate contextual replies.

## Overview

**MailMind** is a web-based AI email assistant built to improve email productivity by combining Gmail integration with AI-powered email analysis.

The system connects to a user's Gmail inbox, retrieves emails, analyzes their content, extracts important information, and generates contextual reply drafts.

The project is designed as a practical **AI + productivity application**, with a focus on reducing the time required to read, understand, and respond to emails.

---

## Problem Statement

Managing a large number of emails can be time-consuming.

Users often need to:

* Read long emails to understand the main point
* Identify important dates and deadlines
* Determine the urgency of an email
* Extract key information
* Decide what action should be taken
* Write appropriate replies

MailMind addresses these problems by bringing email understanding and AI-assisted response generation into a single workspace.

---

## Key Features

### Gmail Integration

* Google OAuth authentication
* Secure Gmail account connection
* Fetch emails directly from Gmail
* Display inbox messages
* Open individual emails
* Retrieve complete email content
* Search and select emails

### AI Email Analysis

MailMind can analyze email content and provide:

* Email summary
* Email category
* Priority level
* Key points
* Recommended action
* Deadline detection
* Important date extraction

### AI Reply Assistant

Users can:

* Generate contextual email replies
* Select a preferred reply tone
* Edit generated replies
* Regenerate replies
* Copy replies to the clipboard
* Send replies directly through Gmail

### Error Handling

The application includes handling for:

* Gmail authentication errors
* Gmail API failures
* Missing configuration
* AI API failures
* Temporary AI service unavailability

---

## Current MVP Status

### Completed

* [x] Next.js application setup
* [x] MailMind dashboard UI
* [x] Gmail OAuth authentication
* [x] Gmail inbox integration
* [x] Email listing
* [x] Email search
* [x] Individual email viewer
* [x] Full email body extraction
* [x] Gemini API integration
* [x] AI email analysis
* [x] Email summarization
* [x] Email categorization
* [x] Priority detection
* [x] Key point extraction
* [x] Recommended action generation
* [x] Important date extraction
* [x] Deadline detection
* [x] AI-generated reply drafts
* [x] Reply tone selection
* [x] Reply editing
* [x] Copy reply
* [x] Regenerate reply
* [x] Gmail reply sending implementation
* [x] AI and Gmail error handling
* [x] Recruiter-ready project structure

---

## Current Development Status

The current repository represents the **MailMind MVP**.

The Gmail integration, application UI, backend routes, AI integration, analysis workflow, and reply workflow have been implemented.

The Gemini API is currently subject to occasional temporary `503 UNAVAILABLE` responses caused by model/service availability. This is an external API availability issue rather than an application-side authentication failure.

The application already handles this situation by displaying an appropriate error message to the user.

Future development will improve AI reliability through retry and fallback mechanisms.

---

## System Workflow

```text
User
  │
  ▼
MailMind Web Application
  │
  ├──────────────► Gmail OAuth
  │                    │
  │                    ▼
  │              Gmail API
  │                    │
  │                    ▼
  │              Email Data
  │
  └──────────────► Gemini API
                       │
                       ▼
                AI Email Analysis
                       │
             ┌─────────┴─────────┐
             ▼                   ▼
       Email Insights       Reply Generation
             │                   │
             └─────────┬─────────┘
                       ▼
                  MailMind UI
                       │
                       ▼
                 Gmail Reply
```

---

## Technology Stack

### Frontend

* Next.js
* React
* TypeScript
* Tailwind CSS

### Backend

* Next.js API Routes
* Node.js
* Gmail API
* Google OAuth

### AI

* Google Gemini API
* `@google/genai`

### APIs

* Gmail API
* Google OAuth
* Gemini API

### Development Tools

* Git
* GitHub
* npm

---

## Project Structure

```text
ai-email-assistant/
│
├── app/
│   ├── api/
│   │   ├── ai/
│   │   │   ├── analyze/
│   │   │   ├── reply/
│   │   │   └── test/
│   │   │
│   │   ├── auth/
│   │   │   ├── callback/
│   │   │   └── login/
│   │   │
│   │   └── gmail/
│   │       ├── messages/
│   │       └── reply/
│   │
│   ├── HomeClient.tsx
│   ├── page.tsx
│   ├── layout.tsx
│   └── globals.css
│
├── lib/
│   └── google.ts
│
├── public/
│
├── .env.local
├── .gitignore
├── package.json
├── package-lock.json
├── next.config.ts
└── README.md
```

---

## Getting Started

### 1. Clone the repository

```bash
git clone https://github.com/YOUR_USERNAME/mailmind-ai-email-assistant.git
cd mailmind-ai-email-assistant
```

### 2. Install dependencies

```bash
npm install
```

### 3. Configure environment variables

Create a `.env.local` file:

```env
GEMINI_API_KEY=your_gemini_api_key

GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_REDIRECT_URI=http://localhost:3000/api/auth/callback
```

Never commit `.env.local` or expose API keys publicly.

### 4. Start the development server

```bash
npm run dev
```

Open:

```text
http://localhost:3000
```

---

## Gmail OAuth Setup

MailMind uses Google OAuth to connect to Gmail.

The Google Cloud project must have the required Gmail API enabled and appropriate OAuth credentials configured.

The redirect URI used by the application is:

```text
http://localhost:3000/api/auth/callback
```

For production deployment, this must be replaced with the production callback URL.

---

# Development Roadmap

## Phase 1 — MVP

**Status: Completed**

The first phase focused on establishing the core MailMind workflow:

```text
Gmail
  ↓
Email Retrieval
  ↓
Email Analysis
  ↓
Important Information
  ↓
AI Reply Generation
  ↓
Gmail Reply
```

---

## Phase 2 — Intelligent Email Management

**Status: Planned**

The next development phase will focus on making MailMind more proactive and intelligent.

### Planned Features

* Automatic email classification
* Smart priority inbox
* Automatic follow-up detection
* Follow-up reminders
* Full email thread summarization
* Context-aware reply generation
* Multiple AI reply suggestions
* Natural-language email search
* Personalized AI instructions
* Advanced Gmail actions
* Email analytics dashboard
* Response-time analytics
* Email productivity insights

---

## Phase 3 — Advanced AI Assistant

Future development can extend MailMind toward a more autonomous email productivity assistant.

Potential capabilities include:

* Personalized email understanding
* User-specific response preferences
* Conversation memory
* Intelligent follow-up scheduling
* Action-item tracking
* Meeting and deadline intelligence
* Automated workflow suggestions
* Advanced productivity analytics
* Production deployment
* Scalable cloud architecture

---

## Security Considerations

MailMind uses environment variables for sensitive credentials.

The following information should never be committed to GitHub:

* Gemini API keys
* Google OAuth client secrets
* Gmail credentials
* `.env.local`

The project includes `.gitignore` rules to prevent local environment files from being committed.

For production deployment, additional security measures such as secure secret management, HTTPS, OAuth configuration, token protection, and proper access controls should be implemented.

---

## Current Limitations

The current version is an MVP and has several limitations:

* AI generation depends on external Gemini API availability.
* Gmail OAuth currently requires appropriate Google Cloud configuration.
* The application is primarily designed for local development.
* Advanced email automation is not yet implemented.
* AI-generated replies should be reviewed by the user before sending.
* Production-scale authentication and deployment hardening are future work.

---

## Future Vision

MailMind aims to evolve from an AI-assisted email interface into an intelligent productivity layer for email.

The long-term goal is to help users understand important communication, identify actions and deadlines, prepare appropriate responses, and manage follow-ups while keeping the user in control of final email decisions.

---

## Author

**Suzana**

B.Tech Computer Science & Engineering
Srinivas University

---

## License

This project is licensed under the MIT License.
