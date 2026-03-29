import axios from 'axios';

// ✅ Uses env variable in production, falls back to localhost in dev
const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

export const api = axios.create({
  baseURL: API_BASE,
  headers: { 'Content-Type': 'application/json' },
});

// ✅ Deduplication map — tracks in-flight requests
// If same request fires twice, second one is ignored
const pendingRequests = new Map<string, Promise<any>>();

const dedupe = <T>(key: string, request: () => Promise<T>): Promise<T> => {
  if (pendingRequests.has(key)) {
    return pendingRequests.get(key) as Promise<T>;
  }
  const promise = request().finally(() => {
    pendingRequests.delete(key);
  });
  pendingRequests.set(key, promise);
  return promise;
};

export const createSession = (data: {
  candidate_name: string;
  role: string;
  experience_level: string;
  tech_stack: string;
  question_count: number;
}) => api.post('/sessions/', data);

export const getSessions = () => api.get('/sessions/');

export const getSession = (id: number) =>
  dedupe(`getSession-${id}`, () => Promise.resolve(api.get(`/sessions/${id}`)));

export const deleteSession = (id: number) => api.delete(`/sessions/${id}`);

// ✅ completeSession is deduplicated — second call returns same promise
export const completeSession = (id: number) =>
  dedupe(`completeSession-${id}`, () => Promise.resolve(api.post(`/sessions/${id}/complete`)));

export const submitAnswer = (questionId: number, answer: string) =>
  dedupe(`submitAnswer-${questionId}`, () =>
    Promise.resolve(api.post(`/questions/${questionId}/answer`, { answer }))
  );

export const evaluateAnswer = (questionId: number, role: string, experience_level: string) =>
  dedupe(`evaluateAnswer-${questionId}`, () =>
    Promise.resolve(api.post(`/feedback/evaluate/${questionId}`, { role, experience_level }))
  );