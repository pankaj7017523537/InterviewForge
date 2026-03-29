import pytest
import sys
import os

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app import create_app
from database import db


@pytest.fixture
def client():
    app = create_app()
    app.config['TESTING'] = True
    app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///:memory:'

    with app.app_context():
        db.create_all()
        yield app.test_client()
        db.session.remove()
        db.drop_all()


def test_get_sessions_empty(client):
    res = client.get('/api/sessions/')
    assert res.status_code == 200
    assert res.get_json() == []


def test_create_session_missing_fields(client):
    res = client.post('/api/sessions/', json={
        'candidate_name': 'John',
    })
    assert res.status_code == 400
    assert 'error' in res.get_json()


def test_get_nonexistent_session(client):
    res = client.get('/api/sessions/999')
    assert res.status_code == 404


def test_submit_answer_no_session(client):
    res = client.post('/api/questions/999/answer', json={'answer': 'My answer'})
    assert res.status_code == 404


def test_evaluate_no_answer(client):
    res = client.post('/api/feedback/evaluate/999')
    assert res.status_code == 404


def test_delete_nonexistent_session(client):
    res = client.delete('/api/sessions/999')
    assert res.status_code == 404


def test_session_list_structure(client):
    res = client.get('/api/sessions/')
    data = res.get_json()
    assert isinstance(data, list)


def test_complete_nonexistent_session(client):
    res = client.post('/api/sessions/999/complete')
    assert res.status_code == 404