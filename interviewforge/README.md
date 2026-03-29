# 🎯 InterviewForge — Forge your interview skills with AI

InterviewForge is an AI-powered interview platform that generates tailored technical interview questions, evaluates candidate answers in real time, and produces structured hire/no-hire reports.

---

## 🚀 Quick Start

### Prerequisites
- Python 3.10+
- Node.js 18+
- Groq API Key (free at [console.groq.com](https://console.groq.com))

### 1. Backend Setup

```bash
cd backend
pip install -r requirements.txt

# Create your .env file
echo "GROQ_API_KEY=gsk_your_key_here" > .env

# Start the server
python app.py
```

Backend runs at `http://localhost:5000`

### 2. Frontend Setup

```bash
cd frontend
npm install
npm start
```

Frontend runs at `http://localhost:3000`

### 3. Run Tests

```bash
cd backend
GROQ_API_KEY=any_value python -m pytest tests/ -v
```

---

## 🏗️ Architecture

```
interviewforge/
├── backend/
│   ├── app.py              # Flask factory, CORS, blueprint registration
│   ├── database.py         # SQLAlchemy models (InterviewSession, Question)
│   ├── ai_service.py       # Groq AI integration (questions, eval, report)
│   ├── routes/
│   │   ├── sessions.py     # CRUD + complete session
│   │   ├── questions.py    # Submit answers
│   │   └── feedback.py     # AI evaluation endpoint
│   └── tests/
│       └── test_api.py     # 8 pytest tests
├── frontend/
│   └── src/
│       ├── App.tsx          # Router + Nav
│       ├── pages/
│       │   ├── Dashboard.tsx     # Session list + stats
│       │   ├── NewSession.tsx    # Create interview form
│       │   ├── InterviewRoom.tsx # Live interview Q&A
│       │   └── SessionReport.tsx # Final report
│       └── utils/
│           ├── api.ts       # Axios API calls
│           └── types.ts     # TypeScript interfaces
├── docs/
│   ├── claude.md           # AI guidance file
│   └── agents.md           # Agent prompting rules
└── README.md
```

---

## 🔑 Key Technical Decisions

### AI Model: Groq (Llama 3.3 70B)
- **Why Groq**: Free tier, extremely fast inference (~200 tokens/sec), no credit card needed
- **Why Llama 3.3 70B**: Strong reasoning for question generation and answer evaluation
- **Tradeoff**: Less reliable JSON formatting than GPT-4o; mitigated with `_parse_json()` that strips markdown fences

### Database: SQLite
- **Why**: Zero-config, file-based, perfect for assessment scope
- **Tradeoff**: Not production-grade; would swap to PostgreSQL for multi-user deployment
- **Schema**: Two tables — `interview_sessions` (1) → (many) `questions`

### Backend: Flask
- **Why**: Lightweight, minimal boilerplate, explicit routing
- **Pattern**: Factory pattern (`create_app()`) for testability — allows in-memory SQLite in tests
- **Validation**: Required fields checked at route level, AI errors caught and returned as 500

### Frontend: React + TypeScript
- **Why TypeScript**: Prevents type mismatches between API responses and UI
- **Routing**: React Router v6 with 4 pages
- **No state library**: useState/useEffect sufficient for this scope; Redux would be over-engineering

### API Design
- REST with predictable URL structure
- Sessions are the root resource; questions and feedback are sub-resources
- All responses return `to_dict()` serialized models

---

## 🤖 AI Usage

AI is used in three places:

1. **Question Generation** (`generate_interview_questions`): Given role, level, and tech stack, Claude generates N tailored questions with category and difficulty labels

2. **Answer Evaluation** (`evaluate_answer`): Each answer is scored 0–10 with structured feedback including strengths, improvements, and a follow-up question

3. **Session Report** (`generate_session_report`): After all answers, AI produces an overall assessment with hire recommendation and suggested learning resources

All AI calls use **structured JSON output** via prompt engineering (no function calling needed with Llama 3.3).

---

## ⚠️ Known Risks & Tradeoffs

| Risk | Mitigation |
|------|-----------|
| AI returns malformed JSON | `_parse_json()` strips fences; try/catch returns 500 with message |
| Groq rate limits (free tier) | Errors surface to UI; user can retry |
| SQLite concurrent writes | Acceptable for single-user assessment use case |
| No auth | Out of scope; would add JWT for production |
| AI scores may be inconsistent | Scores are guidance, not ground truth |

---

## 🔭 Extension Approach

1. **Multi-user**: Add user model + JWT auth, swap SQLite → PostgreSQL
2. **Voice interviews**: Add Whisper (speech-to-text) for spoken answers
3. **Custom question banks**: Let interviewers save and reuse question sets
4. **Candidate portal**: Email session link to candidate, track completion
5. **Analytics dashboard**: Score trends across candidates and roles

---

## 📡 API Reference

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/sessions/` | List all sessions |
| POST | `/api/sessions/` | Create session + generate questions |
| GET | `/api/sessions/:id` | Get session + questions |
| POST | `/api/sessions/:id/complete` | Complete + generate report |
| DELETE | `/api/sessions/:id` | Delete session |
| POST | `/api/questions/:id/answer` | Submit answer |
| POST | `/api/feedback/evaluate/:id` | AI evaluate answer |
