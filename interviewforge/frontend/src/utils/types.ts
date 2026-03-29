export interface Session {
  id: number;
  candidate_name: string;
  role: string;
  experience_level: string;
  tech_stack: string;
  status: 'active' | 'completed';
  overall_score: number | null;
  created_at: string;
  completed_at: string | null;
  question_count: number;
}

export interface Question {
  id: number;
  session_id: number;
  question_text: string;
  category: 'technical' | 'behavioral' | 'system-design';
  difficulty: 'easy' | 'medium' | 'hard';
  candidate_answer: string | null;
  ai_feedback: string | null;
  score: number | null;
  follow_up: string | null;
  order_index: number;
  answered_at: string | null;
}

export interface Evaluation {
  score: number;
  feedback: string;
  strengths: string;
  improvements: string;
  follow_up: string;
}

export interface SessionReport {
  overall_assessment: string;
  hire_recommendation: 'strong_yes' | 'yes' | 'maybe' | 'no';
  key_strengths: string[];
  areas_for_growth: string[];
  suggested_resources: string[];
}
