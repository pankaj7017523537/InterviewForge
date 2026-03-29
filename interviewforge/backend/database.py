from flask_sqlalchemy import SQLAlchemy
from datetime import datetime

db = SQLAlchemy()

class InterviewSession(db.Model):
    __tablename__ = 'interview_sessions'

    id = db.Column(db.Integer, primary_key=True)
    candidate_name = db.Column(db.String(100), nullable=False)
    role = db.Column(db.String(100), nullable=False)
    experience_level = db.Column(db.String(50), nullable=False)  # junior/mid/senior
    tech_stack = db.Column(db.String(255), nullable=False)
    status = db.Column(db.String(20), default='active')  # active/completed
    overall_score = db.Column(db.Float, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    completed_at = db.Column(db.DateTime, nullable=True)

    questions = db.relationship('Question', backref='session', lazy=True, cascade='all, delete-orphan')

    def to_dict(self):
        return {
            'id': self.id,
            'candidate_name': self.candidate_name,
            'role': self.role,
            'experience_level': self.experience_level,
            'tech_stack': self.tech_stack,
            'status': self.status,
            'overall_score': self.overall_score,
            'created_at': self.created_at.isoformat(),
            'completed_at': self.completed_at.isoformat() if self.completed_at else None,
            'question_count': len(self.questions)
        }


class Question(db.Model):
    __tablename__ = 'questions'

    id = db.Column(db.Integer, primary_key=True)
    session_id = db.Column(db.Integer, db.ForeignKey('interview_sessions.id'), nullable=False)
    question_text = db.Column(db.Text, nullable=False)
    category = db.Column(db.String(50), nullable=False)  # technical/behavioral/system-design
    difficulty = db.Column(db.String(20), nullable=False)  # easy/medium/hard
    candidate_answer = db.Column(db.Text, nullable=True)
    ai_feedback = db.Column(db.Text, nullable=True)
    score = db.Column(db.Float, nullable=True)
    follow_up = db.Column(db.Text, nullable=True)
    order_index = db.Column(db.Integer, default=0)
    answered_at = db.Column(db.DateTime, nullable=True)

    def to_dict(self):
        return {
            'id': self.id,
            'session_id': self.session_id,
            'question_text': self.question_text,
            'category': self.category,
            'difficulty': self.difficulty,
            'candidate_answer': self.candidate_answer,
            'ai_feedback': self.ai_feedback,
            'score': self.score,
            'follow_up': self.follow_up,
            'order_index': self.order_index,
            'answered_at': self.answered_at.isoformat() if self.answered_at else None
        }
