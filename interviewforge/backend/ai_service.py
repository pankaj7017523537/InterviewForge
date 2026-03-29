import os
import json
import re
import random
import logging
from groq import Groq
from dotenv import load_dotenv

load_dotenv()
logger = logging.getLogger(__name__)

client = Groq(api_key=os.environ.get("GROQ_API_KEY"))
MODEL = "llama-3.3-70b-versatile"


def _parse_json(raw: str):
    raw = raw.strip()
    raw = re.sub(r'^```[a-z]*\n?', '', raw)
    raw = re.sub(r'\n?```$', '', raw)
    return json.loads(raw.strip())


def generate_interview_questions(role: str, experience_level: str, tech_stack: str, count: int = 5) -> list:
    """Generate a list of basic junior-level verbal interview questions."""

    prompt = f"""You are an interviewer conducting a spoken voice interview for a JUNIOR {role} position.
Tech Stack: {tech_stack}
Experience Level: {experience_level}

Generate exactly {count} simple, basic interview questions suitable for a fresher or junior candidate.

STRICT RULES — you MUST follow all of these:
1. Questions must be answerable VERBALLY in 1-2 minutes — NO coding, NO writing code
2. Keep them BASIC — like "What is a variable?", "What does HTML stand for?", "What is a loop?"
3. Mix of categories: technical, behavioral, situational
4. Do NOT ask to write, implement, design systems, or solve algorithms
5. Do NOT ask complex architecture or advanced topics
6. Questions should be for a fresher with 0-6 months experience

Good examples:
- "What is the difference between a class and an object?"
- "What does CSS stand for and what is it used for?"
- "What is Python used for?"
- "Tell me about yourself and why you chose this field."
- "If you get stuck on a bug, what would you do?"

Respond ONLY with a valid JSON array, no markdown, no extra text:
[
  {{
    "question_text": "question here",
    "category": "technical",
    "difficulty": "easy"
  }}
]

category must be one of: technical, behavioral, situational
difficulty must be: easy"""

    try:
        response = client.chat.completions.create(
            model=MODEL,
            messages=[{"role": "user", "content": prompt}],
            temperature=0.7,
            max_tokens=1000,
        )
        raw = response.choices[0].message.content
        data = _parse_json(raw)
        if isinstance(data, list):
            return data
        raise ValueError("Response is not a list")
    except Exception as e:
        logger.error(f"AI question generation error: {e}")
        fallbacks = [
            {"question_text": f"What is {role} and what kind of work does a {role} do?", "category": "technical", "difficulty": "easy"},
            {"question_text": "Tell me about yourself and why you are interested in this role.", "category": "behavioral", "difficulty": "easy"},
            {"question_text": "What programming language are you most comfortable with and why?", "category": "technical", "difficulty": "easy"},
            {"question_text": "What is the difference between frontend and backend development?", "category": "technical", "difficulty": "easy"},
            {"question_text": "If you get stuck on a bug, what steps would you take to fix it?", "category": "situational", "difficulty": "easy"},
            {"question_text": "What is an API and how does it work in simple terms?", "category": "technical", "difficulty": "easy"},
            {"question_text": "What is version control and why is it important?", "category": "technical", "difficulty": "easy"},
        ]
        return fallbacks[:count]


def generate_question(role: str, difficulty: str, category: str, existing_ids: list) -> dict:
    """Generate a single basic junior-level verbal interview question via AI."""

    prompt = f"""You are an interviewer conducting a spoken voice interview for a JUNIOR {role} position.

Generate ONE simple, basic question suitable for a fresher or junior candidate.

STRICT RULES:
1. Answerable VERBALLY in 1-2 minutes — NO coding, NO writing code
2. Keep it BASIC — like "What is a variable?", "What is a loop?"
3. Category: {category}
4. Do NOT ask to write, implement, or design systems
5. Fresher level: 0-6 months experience

Respond ONLY with valid JSON, no markdown:
{{
  "text": "Your simple verbal question here",
  "tip": "What a good answer should mention in one sentence"
}}"""

    try:
        response = client.chat.completions.create(
            model=MODEL,
            messages=[{"role": "user", "content": prompt}],
            temperature=0.7,
            max_tokens=300,
        )
        raw = response.choices[0].message.content
        data = _parse_json(raw)
        return {"text": data.get("text", ""), "tip": data.get("tip", "")}
    except Exception as e:
        logger.error(f"AI single question generation error: {e}")
        fallbacks = [
            {"text": f"What is {role} and what kind of projects do they work on?", "tip": ""},
            {"text": "What is the difference between a variable and a constant?", "tip": ""},
            {"text": "What is an API and how does it work?", "tip": ""},
            {"text": "What is the difference between frontend and backend development?", "tip": ""},
        ]
        return random.choice(fallbacks)


def evaluate_answer(question, answer, role, experience_level):
    prompt = f"""You are an expert technical interviewer evaluating a {experience_level} {role} candidate.

Question: {question}
Candidate's Answer: {answer}

Return ONLY a valid JSON object (no markdown):
{{
  "score": <0-10>,
  "feedback": "<detailed feedback>",
  "strengths": ["<strength 1>", "<strength 2>"],
  "improvements": ["<improvement 1>", "<improvement 2>"],
  "follow_up": "<one follow-up question>"
}}

IMPORTANT: strengths and improvements MUST be JSON arrays of strings, not plain text strings."""

    response = client.chat.completions.create(
        model=MODEL,
        messages=[{"role": "user", "content": prompt}],
        temperature=0.5,
        max_tokens=1000,
    )
    result = _parse_json(response.choices[0].message.content)

    # Ensure strengths and improvements are always arrays
    if isinstance(result.get("strengths"), str):
        result["strengths"] = [result["strengths"]] if result["strengths"] else []
    if isinstance(result.get("improvements"), str):
        result["improvements"] = [result["improvements"]] if result["improvements"] else []

    return result


def generate_session_report(session_data, questions):
    qa_pairs = []
    for q in questions:
        if q.get('candidate_answer'):
            qa_pairs.append(f"Q: {q['question_text']}\nA: {q['candidate_answer']}\nScore: {q.get('score','N/A')}/10")

    prompt = f"""Generate a final interview assessment report.

Candidate: {session_data['candidate_name']}
Role: {session_data['role']} ({session_data['experience_level']})
Tech Stack: {session_data['tech_stack']}

Interview Q&A:
{chr(10).join(qa_pairs) if qa_pairs else 'No answers recorded.'}

Return ONLY a valid JSON object (no markdown):
{{
  "overall_assessment": "<2-3 sentence summary>",
  "hire_recommendation": "strong_yes",
  "key_strengths": ["s1", "s2", "s3"],
  "areas_for_growth": ["a1", "a2", "a3"],
  "suggested_resources": ["r1", "r2"]
}}

hire_recommendation must be one of: strong_yes, yes, maybe, no"""

    response = client.chat.completions.create(
        model=MODEL,
        messages=[{"role": "user", "content": prompt}],
        temperature=0.5,
        max_tokens=1000,
    )
    return _parse_json(response.choices[0].message.content)