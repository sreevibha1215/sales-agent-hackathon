
## 🏗️ Architecture
 
```
┌─────────────────────────────────────────────────────────┐
│                     React Frontend                      │
│           (Tailwind CSS + Framer Motion)                │
└────────────────────────┬────────────────────────────────┘
                         │ REST API
┌────────────────────────▼────────────────────────────────┐
│                  FastAPI Backend                         │
│              (JWT Auth via Supabase)                     │
└────────────────────────┬────────────────────────────────┘
                         │
┌────────────────────────▼────────────────────────────────┐
│              LangGraph Agent Orchestrator                │
│                                                         │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐              │
│  │ Market   │  │   ICP    │  │ Company  │              │
│  │ Intel    │→ │ Qualify  │→ │  Intel   │              │
│  └──────────┘  └──────────┘  └──────────┘              │
│        ┌──────────┐  ┌──────────┐  ┌──────────┐        │
│        │ Contact  │→ │  Intent  │→ │  Reco.   │        │
│        │  Intel   │  │  Score   │  │  Agent   │        │
│        └──────────┘  └──────────┘  └──────────┘        │
└─────────────────────────────────────────────────────────┘
                         │
┌────────────────────────▼────────────────────────────────┐
│              Data & External Services                    │
│  PostgreSQL │ Redis │ ChromaDB │ Groq │ Tavily │ Hunter │
└─────────────────────────────────────────────────────────┘
```
 
---
 
## ⭐ Key Design Decisions & USP
 
| Feature | What It Does | Why It's a USP |
|---------|-------------|----------------|
| 🧠 **Dynamic Planner-Based Orchestration** | A Planner Agent analyzes the user's request and dynamically decides which specialized agents should execute and in what sequence. | Eliminates hardcoded workflows, making the platform intelligent, adaptive, and reusable for multiple business scenarios. |
| 🤖 **Modular Multi-Agent Architecture** | Independent AI agents (Market Intel, ICP Qualification, Company Intel, Contact Intel, Buying Intent, Recommendation, etc.) each perform a specialized task. | New agents can be added or existing ones modified without affecting the rest of the platform, ensuring scalability and extensibility. |
| 🧩 **Shared Context Memory** | All agents access and update a common LangGraph state throughout the workflow. | Prevents duplicate API calls, reduces execution time and cost, and enables collaborative reasoning across agents. |
| 👤 **Human-in-the-Loop Validation** | Users review and approve shortlisted companies and recommendations before final output is generated. | Builds trust, minimizes AI errors, and provides enterprise-grade decision support instead of fully autonomous automation. |
| 💬 **Natural Language to Intelligent Workflow** | Users describe their business objective in plain English, and the platform automatically extracts the ICP, personas, business rules, and execution strategy. | Removes the need for complex configuration, making the platform intuitive and accessible to non-technical users. |
| 🌐 **Reusable Enterprise Intelligence Platform** | The same platform can be configured for customer discovery, partnership scouting, supplier sourcing, recruitment, M&A intelligence, procurement, and more. | Demonstrates true platform reusability, allowing organizations to solve multiple B2B intelligence problems using a single architecture. |
 
