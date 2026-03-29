# agents.md — AI Agent Prompting Rules

Rules for AI agents (Cursor, Copilot, Claude Code) working on InterviewForge.

---

## Before Making Any Change

1. Read the file you're about to edit — understand what it does
2. Check if any tests cover the code you're changing
3. If changing an API endpoint, check if the frontend `api.ts` calls it

---

## Constraints

- **Scope creep**: Only implement what was asked. Don't add features not requested.
- **Imports**: Don't add new packages without adding them to `requirements.txt` or `package.json`
- **Breaking changes**: Never rename API endpoints or change response JSON keys — the frontend will break silently
- **SQL**: Use SQLAlchemy ORM only — no raw SQL strings

---

## Preferred Patterns

```python
# GOOD: Route with validation and error handling
@bp.route('/', methods=['POST'])
def create():
    data = request.get_json()
    if not data.get('name'):
        return jsonify({'error': 'name is required'}), 400
    try:
        # ... do work
        return jsonify(result), 201
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# BAD: No validation, bare exception
@bp.route('/', methods=['POST'])
def create():
    data = request.get_json()
    result = do_work(data['name'])  # KeyError if missing
    return jsonify(result)
```

---

## Prompt Template for New AI Features

When adding a new AI-powered feature, use this template:

```python
def new_ai_feature(input_data: str) -> dict:
    prompt = f"""[Clear role description]

Input: {input_data}

Return ONLY a valid JSON object (no markdown, no extra text):
{{
  "field1": "<description>",
  "field2": <number>
}}

[List valid enum values if any]"""

    response = client.chat.completions.create(
        model=MODEL,
        messages=[{"role": "user", "content": prompt}],
        temperature=0.5,
        max_tokens=1000,
    )
    return _parse_json(response.choices[0].message.content)
```
