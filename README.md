# Social Report Studio (MVP)

A web application for social media managers and freelance agencies to transform raw Instagram analytics CSV exports into branded, client-ready performance reports with automated metrics, AI-generated executive summaries, PDF exports, and unguessable shareable client links.

---

## Features

- **Authentication & Agency Profile**:
  - Secure registration & login with salted `bcrypt` password hashing and JWT.
  - Agency Branding: Upload custom agency logo and choose a primary brand accent color that automatically formats every report, PDF, and client link.
- **Instagram CSV Ingestion & Metrics Calculation**:
  - Robust CSV parser supporting standard Meta Business Suite / Instagram analytics exports.
  - Automatically calculates:
    - **Follower Growth**: Start -> End audience, net followers gained/lost, % growth rate.
    - **Total Engagement**: Sum of Likes + Comments + Shares + Saves.
    - **Engagement Rate**: Calculated against reach/followers.
    - **Period Momentum & Trend**: Half-over-half growth velocity.
    - **Top 3 Posts**: Automatically ranked by total engagement with format badges (Reel, Carousel, Photo) and engagement breakdown.
- **AI-Powered Executive Summary**:
  - Automatically drafts a concise 2-4 sentence plain-English business summary highlighting audience growth, engagement rates, top content driver, and momentum.
  - Uses the official Google GenAI SDK (`@google/genai` Gemini 2.5 Flash).
  - Includes a smart deterministic rule-based fallback if no `GEMINI_API_KEY` is provided, ensuring zero crashes.
- **Client-Ready Report & PDF Export**:
  - Live interactive report page with interactive engagement velocity chart (Recharts).
  - Dedicated print stylesheet (`@media print`) and **"Download PDF Report"** button.
- **Shareable Unguessable Client Link**:
  - Each report generates an unguessable 128-bit cryptographic token.
  - Clients can view their report in read-only mode without logging in.
- **Zero-Friction 1-Click Testing**:
  - Includes a built-in 30-day realistic sample dataset ("Glow Botanicals") and a 1-click Demo Login button so you can test immediately without needing your own CSV ready.

---

## Quick Start Guide

### 1. Start the Application
In the project root (`C:\Users\sidou\.gemini\antigravity\scratch\social-report-generator`):

```bash
npm start
```
This launches:
- **Backend API**: `http://localhost:5000`
- **Frontend App**: `http://localhost:5173`

### 2. (Optional) Enable Live Gemini API
To use live Gemini 2.5 Flash for AI summary generation:
1. Open `server/.env`.
2. Set your Gemini API key:
   ```env
   GEMINI_API_KEY=your_actual_gemini_api_key
   ```
*(Note: If left empty, the app will automatically use the built-in smart metrics fallback).*

### 3. Run the CSV Parser Unit Tests
To verify the metrics calculations against the sample dataset:
```bash
npm run test:parser
```

---

## Architecture & File Map

```
social-report-generator/
├── start.js                      # Dual process orchestrator (Server + Vite)
├── package.json
├── server/
│   ├── server.js                 # Express app & middleware
│   ├── db.js                     # SQLite schema (users, reports)
│   ├── services/
│   │   ├── csvParser.js          # Instagram CSV parser & metrics engine
│   │   └── aiSummary.js          # Gemini API summary & fallback generator
│   ├── routes/
│   │   ├── auth.js               # JWT auth & bcrypt password hashing
│   │   ├── agency.js             # Logo upload & brand color update
│   │   └── reports.js            # Report creation, listing, public token route
│   ├── data/
│   │   └── sample_instagram_export.csv  # Bundled 30-day sample data
│   └── tests/
│       ├── testParser.js         # CSV calculation tests
│       └── testApi.js            # Full integration test
└── client/
    ├── index.html
    └── src/
        ├── App.jsx               # App routing & public shareable view
        ├── api.js                # API client with JWT storage
        ├── components/
        │   ├── Navbar.jsx        # Agency branding header
        │   ├── Auth.jsx          # Login, Register & 1-Click Demo
        │   ├── Dashboard.jsx     # Report list & share links
        │   ├── ReportCreate.jsx  # CSV upload & Sample Data loader
        │   ├── ReportView.jsx    # Client-ready report, PDF export & charts
        │   └── AgencySettings.jsx# Logo uploader & brand color picker
        └── index.css             # Tailwind CSS & Print optimization
```
