import os
from dotenv import load_dotenv

load_dotenv()

from flask import Flask
from flask_cors import CORS
from database import db
from routes.sessions import sessions_bp
from routes.questions import questions_bp
from routes.feedback import feedback_bp


def create_app():
    app = Flask(__name__)
    app.config['SQLALCHEMY_DATABASE_URI'] = os.getenv('DATABASE_URL', 'sqlite:///interviewforge.db')
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
    app.config['SECRET_KEY'] = os.getenv('SECRET_KEY', 'interviewforge-secret-2024')

    CORS(app, origins=["http://localhost:3000", os.getenv('FRONTEND_URL', '')])
    db.init_app(app)

    app.register_blueprint(sessions_bp, url_prefix='/api/sessions')
    app.register_blueprint(questions_bp, url_prefix='/api/questions')
    app.register_blueprint(feedback_bp, url_prefix='/api/feedback')

    with app.app_context():
        db.create_all()

    return app


if __name__ == '__main__':
    app = create_app()
    app.run(debug=True, port=5000)