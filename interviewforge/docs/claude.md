# claude.md — AI Agent Guidance for InterviewForge

This file defines how AI agents should behave when working on this codebase.

---

## Project Context

InterviewForge is a Flask + React interview platform using Groq (Llama 3.3 70B) for:
1. Generating tailored interview questions
2. Evaluating candidate answers with scores + feedback
3. Producing final hire/no-hire assessment reports

---

## Coding Standards

### Python (Backend)
- Use type hints on all function signatures
- All AI calls must be wrapped in try/except — never let AI failures crash the app
- All JSON parsing must use `_parse_json()` — never `json.loads()` directly on AI output
- Flask routes must validate required fields and return 400 for missing data
- Database models must implement `to_dict()` for consistent serialization
- Never expose raw SQLAlchemy errors to the client

### TypeScript (Frontend)
- All API response shapes must have a corresponding interface in `types.ts`
- Never use `any` — use proper types or `unknown` + type guard
- API calls live in `utils/api.ts` only — components never call `axios` directly
- Loading states must be shown for all async operations
- Errors must be displayed in the UI, never just console.logged

---

## AI Prompt Rules

When modifying prompts in `ai_service.py`:

1. **Always request JSON-only output** — include "Return ONLY a valid JSON object/array (no markdown, no explanation)" in every prompt
2. **Enumerate valid enum values** — always list exactly which strings are valid for category, difficulty, hire_recommendation
3. **Keep prompts deterministic** — use temperature 0.5 for evaluation (consistency), 0.7 for question generation (variety)
4. **Never trust raw AI output** — always run through `_parse_json()` which strips markdown fences
5. **Include context** — always pass role and experience_level so AI calibrates difficulty correctly

---

## Safe Changes

These changes are low-risk:
- Adding new fields to `to_dict()` (additive, non-breaking)
- Adding new routes that don't modify existing ones
- Updating prompt wording (test output format still works)
- Adding more test cases

---

## Risky Changes — Review Carefully

- Changing `_parse_json()` — all AI calls depend on this
- Modifying `InterviewSession` or `Question` models — requires DB migration
- Changing API response structure — frontend will break
- Changing prompt JSON schema — must update both prompt and consuming code together

---

## Testing Requirements

- All new routes must have at least one test in `tests/test_api.py`
- Tests must use in-memory SQLite (`sqlite:///:memory:`)
- Never make real AI calls in tests — mock or set `GROQ_API_KEY=test_key`
- Run tests with: `GROQ_API_KEY=test_key python -m pytest tests/ -v`

---

## What AI Should NOT Do

- Do not add authentication/auth middleware without user approval
- Do not change the database from SQLite without explicit instruction
- Do not add new Python dependencies without updating `requirements.txt`
- Do not remove error handling to make code shorter
- Do not use `eval()` or `exec()` anywhere
