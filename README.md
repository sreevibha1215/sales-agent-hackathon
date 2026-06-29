# 🤖 LeadSenseAI – Agentic AI Platform for B2B Customer Discovery

[![Python](https://img.shields.io/badge/Python-3.12+-blue.svg)](https://python.org)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.104.1-green.svg)](https://fastapi.tiangolo.com)
[![React](https://img.shields.io/badge/React-18.2.0-61dafb.svg)](https://reactjs.org)
[![LangGraph](https://img.shields.io/badge/LangGraph-0.0.20-purple.svg)](https://langchain-ai.github.io/langgraph/)
[![License](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![Hackathon](https://img.shields.io/badge/Hackathon-Agentic%20AI-red.svg)]()

---

## 👥 Team Details
## AVENGERS

| Name | Mail id |
|------|------------------------------|
| Sreevibha Mugata | sreevibha1215@gmsil.com |
| Sri Varsha Pinninty | srivarshapinninty@gmail.com |
| Samhita Siddamshetty | samhitasiddamshetty@gmail.com |

---

## 📖 Project Overview

**LeadSenseAI** is a reusable Agentic AI Platform that automates B2B customer discovery using LangGraph-powered agents.

### The Problem

Sales teams spend **60–70% of their time** manually researching prospects instead of selling. They open LinkedIn, Crunchbase, Google News, company websites, and job portals — creating spreadsheets, searching for decision-makers, guessing email addresses, and repeating the same process every week.

> **The Result:** $1.2M annual waste per company *(Forrester)*

### The Solution

> *"Turn 'Find me the best customers' into a one-line conversation instead of a week of manual research."*

LeadSenseAI uses **6 specialized AI agents** orchestrated by **LangGraph** to:

1. 🔍 Discover real companies from the web
2. 🎯 Qualify them against your Ideal Customer Profile (ICP)
3. 🏢 Enrich with real company data
4. 👤 Find real decision-makers with contact details
5. 📊 Score buying intent
6. 📋 Generate actionable recommendations with human approval

---

## 🎯 Business Use Case

### The Scenario: Salesforce VP of Sales

> *"Imagine you're the Vice President of Sales at Salesforce. Your company has just launched a new AI-powered CRM product targeted at fast-growing SaaS companies in India."*

**The Challenge:**
- Thousands of companies raise funding, hire employees, and expand daily
- Sales teams spend 60–70% of their time on manual research
- By the time they identify the right customer, the opportunity is gone

**The Business Question:**
> *"Who should we contact next?"*

### How LeadSenseAI Solves It

Instead of spending hours researching, the sales manager simply writes:

> *"Find SaaS companies with 200–1500 employees that recently raised funding, are hiring sales teams, and would benefit from an AI-powered CRM. Target personas: VP of Sales, CRO, Head of Sales Operations. Tech stack signals: Salesforce, HubSpot, AWS."*

### The Agent Workflow

| Step | Agent | Action | Business Value |
|------|-------|--------|----------------|
| 1 | **Planner Agent** | Understands the request, creates execution plan | No hardcoded workflows |
| 2 | **Market Intelligence Agent** | Monitors news, funding, hiring, product launches | Finds companies in the buying phase |
| 3 | **ICP Qualification Agent** | Checks industry, size, revenue, geography | Only relevant companies move forward |
| 4 | **Company Intelligence Agent** | Enriches with real company data | Sales team understands the business |
| 5 | **Contact Intelligence Agent** | Finds decision-makers with verified contacts | No more LinkedIn stalking |
| 6 | **Buying Intent Agent** | Scores using business signals | Prioritizes high-intent prospects |
| 7 | **Human Approval** | Sales manager reviews and approves | Humans stay in control |
| 8 | **Recommendation Agent** | Generates ranked prospects with next actions | Ready-to-execute sales plan |

### Example Business Output

#### 🥇 Company #1: Freshworks

| Metric | Value |
|--------|-------|
| **Intent Score** | 92/100 |
| **Reason** | Raised funding recently, expanding globally, hiring 52 sales executives |
| **Decision Makers** | VP Sales, CRO, Head of Revenue |
| **Contacts** | ✅ Email &nbsp; ✅ Phone &nbsp; ✅ LinkedIn |
| **Recommended Action** | Schedule a product demo within 7 days highlighting CRM automation and AI-assisted sales forecasting |

#### 🥈 Company #2: Zoho

| Metric | Value |
|--------|-------|
| **Intent Score** | 88/100 |
| **Reason** | Large enterprise expansion but lower immediate buying urgency |
| **Recommended Action** | Focus on AI integrations rather than CRM replacement |

### Business Impact

| Metric | Before LeadSenseAI | After LeadSenseAI |
|--------|--------------------|-------------------|
| **Research Time** | 60–70% of work week | < 10% |
| **Lead Quality** | Inconsistent | 3× better qualification |
| **Deal Close Rate** | Industry average | 2× improvement |
| **Annual Waste** | $1.2M per company | Eliminated |

---

## 🏗️ Architecture
![Architecture Diagram](system_architecture_leadSenseAI.jpg)

---

## 🚀 Setup Instructions

### Prerequisites

| Requirement | Version | Link |
|-------------|---------|------|
| **Python** | 3.12+ | [Download](https://python.org) |
| **Node.js** | 18+ | [Download](https://nodejs.org) |
| **Docker** | 24+ | [Download](https://docker.com) |
| **Git** | Latest | [Download](https://git-scm.com) |

### API Keys Required

| Service | Purpose | Free Tier | Get It |
|---------|---------|-----------|--------|
| **Groq** | LLM for agents | ✅ Free | [console.groq.com](https://console.groq.com) |
| **Tavily** | Web search | ✅ 1,000 calls/month | [tavily.com](https://tavily.com) |
| **Hunter.io** | Contact discovery | ✅ 25 searches/month | [hunter.io](https://hunter.io) |
| **Supabase** | Authentication | ✅ Free | [supabase.com](https://supabase.com) |

---

### Step 1: Clone the Repository

```bash
git clone https://github.com/sreevibha1215/sales-agent-hackathon.git
cd sales-agent-hackathon
```

### Step 2: Configure Environment Variables

Create a `.env` file in the root directory:

```env
# Supabase Authentication
SUPABASE_URL=your_supabase_project_url
SUPABASE_KEY=your_supabase_anon_key

# LLM & Search
GROQ_API_KEY=your_groq_api_key
TAVILY_API_KEY=your_tavily_api_key

# Contact Discovery
HUNTER_API_KEY=your_hunter_api_key
APOLLO_API_KEY=your_apollo_api_key

# Database
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/sales_db
REDIS_URL=redis://localhost:6379
CHROMA_URL=http://localhost:8001

# JWT
JWT_SECRET=your_jwt_secret_key
JWT_ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=1440
```

### Step 3: Start Backend Services

```bash
# Start Docker containers (PostgreSQL, Redis, ChromaDB)
docker-compose up -d

# Install backend dependencies
cd backend
python -m venv venv
source venv/bin/activate        # On Windows: venv\Scripts\activate
pip install -r requirements.txt

# Initialize the database
python database/db.py

# Start FastAPI server
uvicorn main:app --reload --port 8000
```

### Step 4: Start the Frontend

```bash
# Open a new terminal
cd frontend
npm install
npm run dev
```

### Service URLs

| Service | URL |
|---------|-----|
| **Frontend** | http://localhost:5173 |
| **Backend API** | http://localhost:8000 |
| **API Documentation** | http://localhost:8000/docs |

---

## 📖 Usage Guide

### 1. Login / Sign Up

Use the demo account to get started immediately:

| Field | Value |
|-------|-------|
| **Email** | demo@agentic.ai |
| **Password** | Demo123! |

### 2. Create a Workspace

- Click **"New Workspace"** in the sidebar
- Name your workspace (e.g., `"SaaS Discovery"`)

### 3. Configure Your ICP

Describe your ideal customer in natural language:

> *"We sell CRM software to SaaS companies in India with 50–500 employees. We want to reach VP of Sales or CRO."*

Review and edit the extracted configuration before proceeding.

### 4. Run Discovery

- Click **"Launch Discovery Pipeline"**
- Watch all 6 agents work in real-time

### 5. Review Results

- View company cards with intent scores, decision-makers, and next actions
- Approve or reject recommendations

---

## 🧠 Agent Pipeline

### How Discovery Works

| Agent | Technology | Description |
|-------|-----------|-------------|
| **Market Intelligence Agent** | Groq + Tavily | Generates real company names using Groq; searches Tavily for company data |
| **ICP Qualification Agent** | Smart Synonyms | Scores companies against your ICP; filters with 0.3+ threshold |
| **Company Intelligence Agent** | Tavily + Groq | Enriches with real data: employees, revenue, tech stack |
| **Contact Intelligence Agent** | Hunter + Tavily | Finds real decision-makers with verified contact details |
| **Buying Intent Agent** | Weighted Scoring | Scores 0–100% based on funding, size, revenue, tech, and contacts |
| **Recommendation Agent** | Ranking | Sorts by intent score and generates next actions |

---

## 🛠️ Technology Stack

### Backend

| Technology | Purpose |
|-----------|---------|
| **FastAPI** | API framework |
| **LangGraph** | Agent orchestration |
| **LangChain** | LLM integration |
| **Groq** | LLM provider |
| **Tavily** | Web search |
| **Hunter.io** | Contact discovery |
| **Supabase** | Authentication |
| **PostgreSQL** | Primary database |
| **Redis** | Caching & memory |
| **ChromaDB** | Vector storage |

### Frontend

| Technology | Purpose |
|-----------|---------|
| **React 18** | UI framework |
| **Tailwind CSS** | Styling |
| **Framer Motion** | Animations |
| **Recharts** | Data visualization |
| **Axios** | API client |

---

## 📊 Scoring System

### ICP Score (0.0 – 1.0)

Measures how well a company matches your Ideal Customer Profile:

| Signal | Weight |
|--------|--------|
| Industry match | 35% |
| Geography match | 25% |
| Company size | 25% |
| Product relevance | 15% |

### Intent Score (0% – 100%)

Measures how likely a company is to buy:

| Signal | Weight |
|--------|--------|
| Funding signals | 35% |
| Company size match | 20% |
| Revenue signals | 15% |
| Tech stack match | 15% |
| Contacts quality | 15% |

---

## 🔗 Repository

**GitHub:** [https://github.com/sreevibha1215/sales-agent-hackathon](https://github.com/sreevibha1215/sales-agent-hackathon)

---

## 🙏 Acknowledgments

| Tool | Contribution |
|------|-------------|
| [LangGraph](https://langchain-ai.github.io/langgraph/) | Powerful agent orchestration |
| [Groq](https://groq.com) | Fast LLM inference |
| [Tavily](https://tavily.com) | Real-time web search |
| [Hunter.io](https://hunter.io) | Contact discovery |
| [Supabase](https://supabase.com) | Authentication |
| [FastAPI](https://fastapi.tiangolo.com) | Amazing API framework |

---

*Built with ❤️ for the Agentic AI Hackathon*
