from flask import Blueprint, request, jsonify
from database import db, Question
from datetime import datetime

questions_bp = Blueprint('questions', __name__)


@questions_bp.route('/<int:question_id>', methods=['GET'])
def get_question(question_id):
    question = Question.query.get_or_404(question_id)
    return jsonify(question.to_dict())


@questions_bp.route('/<int:question_id>/answer', methods=['POST'])
def submit_answer(question_id):
    question = Question.query.get_or_404(question_id)
    data = request.get_json()
    
    if not data.get('answer'):
        return jsonify({'error': 'Answer is required'}), 400
    
    question.candidate_answer = data['answer']
    question.answered_at = datetime.utcnow()
    db.session.commit()
    
    return jsonify(question.to_dict())
