from flask import Blueprint, request, jsonify
from database import db, Question
from ai_service import evaluate_answer

feedback_bp = Blueprint('feedback', __name__)


@feedback_bp.route('/evaluate/<int:question_id>', methods=['POST'])
def evaluate_question(question_id):
    question = Question.query.get_or_404(question_id)
    
    if not question.candidate_answer:
        return jsonify({'error': 'No answer to evaluate'}), 400

    data = request.get_json() or {}
    role = data.get('role', 'Software Engineer')
    experience_level = data.get('experience_level', 'mid')
    
    try:
        result = evaluate_answer(
            question=question.question_text,
            answer=question.candidate_answer,
            role=role,
            experience_level=experience_level
        )
        
        question.score = result.get('score', 0)
        question.ai_feedback = result.get('feedback', '')
        question.follow_up = result.get('follow_up', '')
        db.session.commit()
        
        return jsonify({
            'question': question.to_dict(),
            'evaluation': result
        })
    
    except Exception as e:
        return jsonify({'error': f'Evaluation failed: {str(e)}'}), 500
