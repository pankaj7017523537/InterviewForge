from flask import Blueprint, request, jsonify
from database import db, InterviewSession, Question
from ai_service import generate_interview_questions, generate_session_report
from datetime import datetime

sessions_bp = Blueprint('sessions', __name__)


@sessions_bp.route('/', methods=['GET'])
def get_sessions():
    sessions = InterviewSession.query.order_by(InterviewSession.created_at.desc()).all()
    return jsonify([s.to_dict() for s in sessions])


@sessions_bp.route('/', methods=['POST'])
def create_session():
    data = request.get_json()
    
    required = ['candidate_name', 'role', 'experience_level', 'tech_stack']
    for field in required:
        if not data.get(field):
            return jsonify({'error': f'{field} is required'}), 400

    session = InterviewSession(
        candidate_name=data['candidate_name'],
        role=data['role'],
        experience_level=data['experience_level'],
        tech_stack=data['tech_stack']
    )
    db.session.add(session)
    db.session.flush()  # get session ID

    # Generate AI questions
    try:
        question_count = data.get('question_count', 5)
        questions_data = generate_interview_questions(
            role=data['role'],
            experience_level=data['experience_level'],
            tech_stack=data['tech_stack'],
            count=question_count
        )
        
        for idx, q in enumerate(questions_data):
            question = Question(
                session_id=session.id,
                question_text=q['question_text'],
                category=q['category'],
                difficulty=q['difficulty'],
                order_index=idx
            )
            db.session.add(question)
        
        db.session.commit()
        return jsonify({
            'session': session.to_dict(),
            'questions': [q.to_dict() for q in session.questions]
        }), 201

    except Exception as e:
        db.session.rollback()
        return jsonify({'error': f'Failed to generate questions: {str(e)}'}), 500


@sessions_bp.route('/<int:session_id>', methods=['GET'])
def get_session(session_id):
    session = InterviewSession.query.get_or_404(session_id)
    questions = Question.query.filter_by(session_id=session_id).order_by(Question.order_index).all()
    return jsonify({
        'session': session.to_dict(),
        'questions': [q.to_dict() for q in questions]
    })


@sessions_bp.route('/<int:session_id>/complete', methods=['POST'])
def complete_session(session_id):
    session = InterviewSession.query.get_or_404(session_id)
    questions = Question.query.filter_by(session_id=session_id).all()

    answered = [q for q in questions if q.score is not None]
    if answered:
        session.overall_score = sum(q.score for q in answered) / len(answered)
    
    session.status = 'completed'
    session.completed_at = datetime.utcnow()
    
    # Generate AI report
    try:
        report = generate_session_report(
            session.to_dict(),
            [q.to_dict() for q in questions]
        )
        db.session.commit()
        return jsonify({
            'session': session.to_dict(),
            'report': report
        })
    except Exception as e:
        db.session.commit()
        return jsonify({
            'session': session.to_dict(),
            'report': None,
            'error': str(e)
        })


@sessions_bp.route('/<int:session_id>', methods=['DELETE'])
def delete_session(session_id):
    session = InterviewSession.query.get_or_404(session_id)
    db.session.delete(session)
    db.session.commit()
    return jsonify({'message': 'Session deleted'})
