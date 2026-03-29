import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getSession, submitAnswer, evaluateAnswer, completeSession } from '../utils/api';
import { Session, Question, Evaluation } from '../utils/types';
import Webcam from 'react-webcam';

declare global {
  interface Window {
    webkitSpeechRecognition: any;
    SpeechRecognition: any;
  }
}

const styles = `
  @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Mono:ital,wght@0,300;0,400;1,300&display=swap');

  * { box-sizing: border-box; margin: 0; padding: 0; }

  :root {
    --bg: #060810;
    --surface: #0d1117;
    --surface2: #161b27;
    --border: rgba(99,179,237,0.12);
    --border-glow: rgba(99,179,237,0.35);
    --accent: #63b3ed;
    --accent2: #4fd1c5;
    --accent3: #f6ad55;
    --danger: #fc8181;
    --text: #e2e8f0;
    --muted: #4a5568;
    --muted2: #718096;
    --score-good: #48bb78;
    --score-mid: #f6ad55;
    --score-bad: #fc8181;
  }

  .forge-room {
    font-family: 'Syne', sans-serif;
    background: var(--bg);
    color: var(--text);
    height: 100vh;
    width: 100vw;
    overflow: hidden;
    position: relative;
    display: flex;
    flex-direction: column;
  }

  .forge-room::before {
    content: '';
    position: absolute;
    inset: 0;
    background:
      radial-gradient(ellipse 60% 40% at 20% 20%, rgba(99,179,237,0.06) 0%, transparent 60%),
      radial-gradient(ellipse 50% 60% at 80% 80%, rgba(79,209,197,0.05) 0%, transparent 60%),
      radial-gradient(ellipse 40% 40% at 60% 10%, rgba(246,173,85,0.04) 0%, transparent 50%);
    pointer-events: none;
    z-index: 0;
  }

  .forge-room::after {
    content: '';
    position: absolute;
    inset: 0;
    background-image:
      linear-gradient(rgba(99,179,237,0.03) 1px, transparent 1px),
      linear-gradient(90deg, rgba(99,179,237,0.03) 1px, transparent 1px);
    background-size: 60px 60px;
    pointer-events: none;
    z-index: 0;
  }

  .topbar {
    position: relative;
    z-index: 10;
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 14px 28px;
    border-bottom: 1px solid var(--border);
    background: rgba(6,8,16,0.85);
    backdrop-filter: blur(12px);
  }

  .topbar-brand {
    display: flex;
    align-items: center;
    gap: 10px;
    font-size: 1.1rem;
    font-weight: 800;
    letter-spacing: -0.02em;
    color: var(--accent);
  }

  .topbar-brand span { color: var(--text); }

  .logo-dot {
    width: 8px;
    height: 8px;
    background: var(--accent2);
    border-radius: 50%;
    box-shadow: 0 0 8px var(--accent2);
    animation: pulse-dot 2s ease-in-out infinite;
  }

  @keyframes pulse-dot {
    0%, 100% { opacity: 1; transform: scale(1); }
    50% { opacity: 0.5; transform: scale(0.7); }
  }

  .topbar-meta {
    display: flex;
    align-items: center;
    gap: 20px;
  }

  .meta-chip {
    font-family: 'DM Mono', monospace;
    font-size: 0.72rem;
    padding: 4px 10px;
    border-radius: 4px;
    border: 1px solid var(--border);
    color: var(--muted2);
    background: var(--surface);
    letter-spacing: 0.05em;
    text-transform: uppercase;
  }

  .meta-chip.role { color: var(--accent); border-color: rgba(99,179,237,0.3); }
  .meta-chip.diff { color: var(--accent3); border-color: rgba(246,173,85,0.3); }

  .progress-bar-wrap {
    display: flex;
    align-items: center;
    gap: 10px;
    font-family: 'DM Mono', monospace;
    font-size: 0.72rem;
    color: var(--muted2);
  }

  .progress-track {
    width: 120px;
    height: 4px;
    background: var(--surface2);
    border-radius: 2px;
    overflow: hidden;
  }

  .progress-fill {
    height: 100%;
    background: linear-gradient(90deg, var(--accent), var(--accent2));
    border-radius: 2px;
    transition: width 0.6s cubic-bezier(0.4, 0, 0.2, 1);
    box-shadow: 0 0 8px rgba(99,179,237,0.5);
  }

  .main-body {
    position: relative;
    z-index: 5;
    flex: 1;
    display: grid;
    grid-template-columns: 1fr 420px;
    gap: 0;
    overflow: hidden;
  }

  .left-panel {
    display: flex;
    flex-direction: column;
    padding: 28px 32px;
    border-right: 1px solid var(--border);
    overflow-y: auto;
    gap: 20px;
  }

  .nova-header {
    display: flex;
    align-items: center;
    gap: 16px;
  }

  .nova-avatar {
    position: relative;
    width: 56px;
    height: 56px;
    flex-shrink: 0;
  }

  .nova-avatar-core {
    width: 100%;
    height: 100%;
    border-radius: 16px;
    background: linear-gradient(135deg, var(--accent) 0%, var(--accent2) 100%);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1.6rem;
    box-shadow: 0 0 24px rgba(99,179,237,0.3), inset 0 1px 0 rgba(255,255,255,0.1);
  }

  .nova-ring {
    position: absolute;
    inset: -4px;
    border-radius: 20px;
    border: 2px solid transparent;
    background: linear-gradient(135deg, rgba(99,179,237,0.4), rgba(79,209,197,0.4)) border-box;
    -webkit-mask: linear-gradient(#fff 0 0) padding-box, linear-gradient(#fff 0 0);
    -webkit-mask-composite: destination-out;
    mask-composite: exclude;
  }

  .nova-speaking .nova-ring {
    animation: nova-pulse 1.2s ease-in-out infinite;
  }

  @keyframes nova-pulse {
    0%, 100% { opacity: 0.4; transform: scale(1); }
    50% { opacity: 1; transform: scale(1.04); }
  }

  .nova-info h2 {
    font-size: 1.1rem;
    font-weight: 700;
    letter-spacing: -0.02em;
    color: var(--text);
  }

  .nova-status {
    font-family: 'DM Mono', monospace;
    font-size: 0.72rem;
    color: var(--muted2);
    display: flex;
    align-items: center;
    gap: 6px;
    margin-top: 3px;
  }

  .status-dot {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: var(--muted);
    transition: background 0.3s;
  }

  .status-dot.speaking { background: var(--accent); box-shadow: 0 0 6px var(--accent); animation: blink 0.8s ease-in-out infinite; }
  .status-dot.listening { background: var(--accent2); box-shadow: 0 0 6px var(--accent2); animation: blink 0.6s ease-in-out infinite; }
  .status-dot.thinking { background: var(--accent3); box-shadow: 0 0 6px var(--accent3); animation: blink 1s ease-in-out infinite; }
  .status-dot.idle { background: var(--score-good); }

  @keyframes blink {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.3; }
  }

  .question-card {
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: 16px;
    padding: 24px;
    position: relative;
    overflow: hidden;
    animation: slide-up 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  }

  @keyframes slide-up {
    from { opacity: 0; transform: translateY(12px); }
    to { opacity: 1; transform: translateY(0); }
  }

  .question-card::before {
    content: '';
    position: absolute;
    top: 0; left: 0; right: 0;
    height: 2px;
    background: linear-gradient(90deg, var(--accent), var(--accent2), transparent);
  }

  .q-label {
    font-family: 'DM Mono', monospace;
    font-size: 0.68rem;
    text-transform: uppercase;
    letter-spacing: 0.12em;
    color: var(--accent);
    margin-bottom: 12px;
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .q-label::after {
    content: '';
    flex: 1;
    height: 1px;
    background: var(--border);
  }

  .question-text {
    font-size: 1.15rem;
    font-weight: 600;
    line-height: 1.65;
    color: var(--text);
    letter-spacing: -0.01em;
  }

  .category-badge {
    display: inline-block;
    margin-top: 14px;
    font-family: 'DM Mono', monospace;
    font-size: 0.68rem;
    padding: 3px 10px;
    border-radius: 20px;
    text-transform: uppercase;
    letter-spacing: 0.08em;
  }

  .category-badge.technical { background: rgba(99,179,237,0.1); color: var(--accent); border: 1px solid rgba(99,179,237,0.2); }
  .category-badge.behavioral { background: rgba(79,209,197,0.1); color: var(--accent2); border: 1px solid rgba(79,209,197,0.2); }
  .category-badge.situational { background: rgba(246,173,85,0.1); color: var(--accent3); border: 1px solid rgba(246,173,85,0.2); }

  .answer-section {
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: 16px;
    padding: 20px;
    min-height: 120px;
    flex: 1;
    position: relative;
  }

  .answer-label {
    font-family: 'DM Mono', monospace;
    font-size: 0.68rem;
    text-transform: uppercase;
    letter-spacing: 0.12em;
    color: var(--muted2);
    margin-bottom: 10px;
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  .answer-text {
    font-family: 'DM Mono', monospace;
    font-size: 0.88rem;
    line-height: 1.7;
    color: var(--text);
    white-space: pre-wrap;
  }

  .answer-placeholder {
    font-family: 'DM Mono', monospace;
    font-size: 0.85rem;
    color: var(--muted);
    font-style: italic;
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .wave-bars {
    display: flex;
    align-items: center;
    gap: 3px;
    height: 20px;
  }

  .wave-bar {
    width: 3px;
    border-radius: 2px;
    background: var(--accent2);
    animation: wave 0.8s ease-in-out infinite;
  }

  .wave-bar:nth-child(1) { animation-delay: 0s; }
  .wave-bar:nth-child(2) { animation-delay: 0.1s; }
  .wave-bar:nth-child(3) { animation-delay: 0.2s; }
  .wave-bar:nth-child(4) { animation-delay: 0.15s; }
  .wave-bar:nth-child(5) { animation-delay: 0.05s; }

  @keyframes wave {
    0%, 100% { height: 4px; }
    50% { height: 18px; }
  }

  .eval-card {
    background: var(--surface2);
    border-radius: 16px;
    padding: 20px;
    border: 1px solid var(--border);
    animation: slide-up 0.3s ease;
  }

  .eval-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 14px;
  }

  .eval-title {
    font-family: 'DM Mono', monospace;
    font-size: 0.72rem;
    text-transform: uppercase;
    letter-spacing: 0.1em;
    color: var(--muted2);
  }

  .score-badge {
    font-size: 1.1rem;
    font-weight: 800;
    padding: 4px 14px;
    border-radius: 8px;
    font-family: 'DM Mono', monospace;
  }

  .score-badge.good { background: rgba(72,187,120,0.15); color: var(--score-good); border: 1px solid rgba(72,187,120,0.25); }
  .score-badge.mid { background: rgba(246,173,85,0.15); color: var(--score-mid); border: 1px solid rgba(246,173,85,0.25); }
  .score-badge.bad { background: rgba(252,129,129,0.15); color: var(--score-bad); border: 1px solid rgba(252,129,129,0.25); }

  .eval-feedback {
    font-size: 0.88rem;
    line-height: 1.6;
    color: var(--muted2);
    margin-bottom: 12px;
  }

  .eval-tags {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
  }

  .eval-tag {
    font-family: 'DM Mono', monospace;
    font-size: 0.68rem;
    padding: 3px 10px;
    border-radius: 4px;
  }

  .eval-tag.strength { background: rgba(72,187,120,0.1); color: var(--score-good); border: 1px solid rgba(72,187,120,0.2); }
  .eval-tag.improve { background: rgba(252,129,129,0.1); color: var(--score-bad); border: 1px solid rgba(252,129,129,0.2); }

  .skip-btn {
    align-self: flex-start;
    font-family: 'DM Mono', monospace;
    font-size: 0.75rem;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    background: transparent;
    border: 1px solid var(--border);
    color: var(--muted2);
    padding: 8px 18px;
    border-radius: 8px;
    cursor: pointer;
    transition: all 0.2s;
    display: flex;
    align-items: center;
    gap: 6px;
  }

  .skip-btn:hover {
    border-color: var(--accent3);
    color: var(--accent3);
    background: rgba(246,173,85,0.05);
  }

  .right-panel {
    display: flex;
    flex-direction: column;
    padding: 28px 24px;
    gap: 18px;
    background: rgba(13,17,23,0.5);
  }

  .webcam-wrap {
    position: relative;
    border-radius: 16px;
    overflow: hidden;
    border: 1px solid var(--border);
    background: #000;
    flex: 1;
    max-height: 320px;
  }

  .webcam-wrap video {
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
  }

  .webcam-overlay {
    position: absolute;
    inset: 0;
    background: linear-gradient(to top, rgba(6,8,16,0.8) 0%, transparent 40%);
  }

  .webcam-label {
    position: absolute;
    bottom: 12px;
    left: 14px;
    font-family: 'DM Mono', monospace;
    font-size: 0.68rem;
    color: rgba(255,255,255,0.6);
    text-transform: uppercase;
    letter-spacing: 0.1em;
  }

  .rec-indicator {
    position: absolute;
    top: 12px;
    right: 12px;
    display: flex;
    align-items: center;
    gap: 6px;
    background: rgba(0,0,0,0.6);
    border: 1px solid rgba(252,129,129,0.3);
    padding: 4px 10px;
    border-radius: 20px;
    font-family: 'DM Mono', monospace;
    font-size: 0.65rem;
    color: var(--danger);
    text-transform: uppercase;
    letter-spacing: 0.08em;
  }

  .rec-dot {
    width: 5px;
    height: 5px;
    background: var(--danger);
    border-radius: 50%;
    animation: blink 1s ease-in-out infinite;
  }

  .q-dots {
    display: flex;
    gap: 6px;
    align-items: center;
  }

  .q-dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: var(--surface2);
    border: 1px solid var(--border);
    transition: all 0.3s;
  }

  .q-dot.done { background: var(--accent2); border-color: var(--accent2); box-shadow: 0 0 6px rgba(79,209,197,0.4); }
  .q-dot.active { background: var(--accent); border-color: var(--accent); width: 20px; border-radius: 4px; box-shadow: 0 0 8px rgba(99,179,237,0.5); }

  .stats-panel {
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: 16px;
    padding: 18px;
  }

  .stats-title {
    font-family: 'DM Mono', monospace;
    font-size: 0.68rem;
    text-transform: uppercase;
    letter-spacing: 0.1em;
    color: var(--muted);
    margin-bottom: 14px;
  }

  .stats-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 10px;
  }

  .stat-item {
    background: var(--surface2);
    border-radius: 10px;
    padding: 12px;
    text-align: center;
  }

  .stat-value {
    font-size: 1.4rem;
    font-weight: 800;
    color: var(--accent);
    letter-spacing: -0.02em;
    font-family: 'DM Mono', monospace;
  }

  .stat-label {
    font-family: 'DM Mono', monospace;
    font-size: 0.63rem;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    color: var(--muted);
    margin-top: 3px;
  }

  .thinking-overlay {
    position: fixed;
    inset: 0;
    background: rgba(6,8,16,0.7);
    backdrop-filter: blur(4px);
    z-index: 100;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-direction: column;
    gap: 16px;
    animation: fade-in 0.2s ease;
  }

  @keyframes fade-in {
    from { opacity: 0; }
    to { opacity: 1; }
  }

  .thinking-spinner {
    width: 48px;
    height: 48px;
    border: 3px solid var(--border);
    border-top-color: var(--accent);
    border-radius: 50%;
    animation: spin 0.8s linear infinite;
  }

  @keyframes spin { to { transform: rotate(360deg); } }

  .thinking-text {
    font-family: 'DM Mono', monospace;
    font-size: 0.85rem;
    color: var(--muted2);
    letter-spacing: 0.05em;
  }

  .loading-screen {
    font-family: 'Syne', sans-serif;
    background: var(--bg);
    color: var(--text);
    height: 100vh;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 20px;
  }

  .loading-logo {
    font-size: 2rem;
    font-weight: 800;
    color: var(--accent);
    letter-spacing: -0.03em;
  }

  .loading-bar {
    width: 200px;
    height: 2px;
    background: var(--surface2);
    border-radius: 2px;
    overflow: hidden;
  }

  .loading-bar-fill {
    height: 100%;
    width: 40%;
    background: linear-gradient(90deg, var(--accent), var(--accent2));
    animation: loading-slide 1.2s ease-in-out infinite;
  }

  @keyframes loading-slide {
    0% { transform: translateX(-100%); }
    100% { transform: translateX(600%); }
  }

  .timeout-bar-wrap {
    position: absolute;
    bottom: 0; left: 0; right: 0;
    height: 3px;
    background: var(--surface2);
  }

  .timeout-bar {
    height: 100%;
    background: linear-gradient(90deg, var(--accent3), var(--danger));
    transition: width 1s linear;
  }

  .left-panel::-webkit-scrollbar { width: 4px; }
  .left-panel::-webkit-scrollbar-track { background: transparent; }
  .left-panel::-webkit-scrollbar-thumb { background: var(--border); border-radius: 2px; }
`;

const SILENCE_TIMEOUT_MS = 3000;
const NO_ANSWER_TIMEOUT_MS = 30000;

// ─── How long after Nova stops speaking before mic opens (ms) ───────────────
// Increase this if echo is still being picked up on your device.
const MIC_OPEN_DELAY_MS = 2000;

export default function InterviewRoom() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [session, setSession] = useState<Session | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [current, setCurrent] = useState(0);
  const [answer, setAnswer] = useState('');
  const [evaluation, setEvaluation] = useState<Evaluation | null>(null);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState<'idle' | 'speaking' | 'listening' | 'thinking'>('idle');
  const [scores, setScores] = useState<number[]>([]);
  const [timeoutPct, setTimeoutPct] = useState(100);

  // Core refs
  const recognitionRef = useRef<any>(null);
  const silenceTimerRef = useRef<any>(null);
  const noAnswerTimerRef = useRef<any>(null);
  const timeoutIntervalRef = useRef<any>(null);
  const micOpenTimerRef = useRef<any>(null);   // ← NEW: delayed mic-open timer

  const isSpeakingRef = useRef(false);         // true while Nova TTS is active
  const micReadyRef = useRef(false);           // ← NEW: true only after delay post-Nova
  const currentRef = useRef(0);
  const questionsRef = useRef<Question[]>([]);
  const processingRef = useRef(false);
  const isCompletingRef = useRef(false);
  const hasStartedRef = useRef(false);   // prevents double-intro in React StrictMode

  // Callback refs
  const killRecognitionRef = useRef<() => void>(() => {});
  const lockMicRef = useRef<() => void>(() => {});
  const unlockMicAfterDelayRef = useRef<(cb: () => void) => void>(() => {});
  const speakRef = useRef<(text: string, cb?: () => void) => void>(() => {});
  const startListeningRef = useRef<() => void>(() => {});
  const askQuestionRef = useRef<(q: Question) => void>(() => {});
  const handleAutoSubmitRef = useRef<(ans: string) => void>(() => {});
  const handleNextQuestionRef = useRef<() => void>(() => {});
  const finishInterviewRef = useRef<() => void>(() => {});
  const startNoAnswerTimerRef = useRef<() => void>(() => {});
  const resetNoAnswerTimerRef = useRef<() => void>(() => {});

  useEffect(() => { currentRef.current = current; }, [current]);
  useEffect(() => { questionsRef.current = questions; }, [questions]);

  // ── HELPERS ───────────────────────────────────────────────────────
  /** Kill any running recognition instance completely */
  const killRecognition = useCallback(() => {
    if (recognitionRef.current) {
      try { recognitionRef.current.abort(); } catch {}
      recognitionRef.current = null;
    }
  }, []);
  killRecognitionRef.current = killRecognition;

  /** Mark Nova as speaking — immediately kill mic and block it */
  const lockMic = useCallback(() => {
    isSpeakingRef.current = true;
    micReadyRef.current = false;
    clearTimeout(micOpenTimerRef.current);
    clearTimeout(silenceTimerRef.current);
    killRecognitionRef.current();
  }, []);
  lockMicRef.current = lockMic;

  /**
   * Called after Nova finishes speaking.
   * Waits MIC_OPEN_DELAY_MS before allowing the mic to open,
   * so any TTS echo has time to fade from the microphone input.
   */
  const unlockMicAfterDelay = useCallback((callback: () => void) => {
    isSpeakingRef.current = false;
    micReadyRef.current = false;
    setStatus('idle');
    clearTimeout(micOpenTimerRef.current);
    micOpenTimerRef.current = setTimeout(() => {
      micReadyRef.current = true;
      callback();
    }, MIC_OPEN_DELAY_MS);
  }, []);
  unlockMicAfterDelayRef.current = unlockMicAfterDelay;

  // ── SPEAK ─────────────────────────────────────────────────────────
  const speak = useCallback((text: string, callback?: () => void) => {
    window.speechSynthesis.cancel();
    lockMicRef.current(); // ensure mic is dead before TTS starts

    setTimeout(() => {
      setStatus('speaking');

      const utter = new SpeechSynthesisUtterance(text);
      utter.rate = 0.95;
      utter.pitch = 1.0;

      const setFemaleVoice = () => {
        const voices = window.speechSynthesis.getVoices();
        const femaleVoiceNames = [
          'Samantha', 'Microsoft Zira', 'Google US English',
          'Microsoft Jenny', 'Karen', 'Moira', 'Tessa', 'Microsoft Aria',
        ];
        let selected: SpeechSynthesisVoice | null = null;
        for (const name of femaleVoiceNames) {
          const found = voices.find(v => v.name.includes(name));
          if (found) { selected = found; break; }
        }
        if (!selected) {
          selected = voices.find(v =>
            v.lang.startsWith('en') &&
            (v.name.toLowerCase().includes('female') || v.name.toLowerCase().includes('woman'))
          ) ?? null;
        }
        if (!selected) selected = voices.find(v => v.lang.startsWith('en')) ?? null;
        if (selected) utter.voice = selected;
      };

      utter.onend = () => {
        unlockMicAfterDelayRef.current(() => callback?.());
      };

      utter.onerror = () => {
        unlockMicAfterDelayRef.current(() => callback?.());
      };

      if (window.speechSynthesis.getVoices().length > 0) {
        setFemaleVoice();
        window.speechSynthesis.speak(utter);
      } else {
        window.speechSynthesis.onvoiceschanged = () => {
          setFemaleVoice();
          window.speechSynthesis.onvoiceschanged = null;
          window.speechSynthesis.speak(utter);
        };
      }
    }, 150);
  }, []);

  // Populate speakRef immediately (not just on effect) so init can use it
  speakRef.current = speak;
  useEffect(() => { speakRef.current = speak; }, [speak]);

  // ── RESET NO ANSWER TIMER ─────────────────────────────────────────
  const resetNoAnswerTimer = useCallback(() => {
    clearTimeout(noAnswerTimerRef.current);
    clearInterval(timeoutIntervalRef.current);
  }, []);

  useEffect(() => { resetNoAnswerTimerRef.current = resetNoAnswerTimer; }, [resetNoAnswerTimer]);

  // ── FINISH INTERVIEW ──────────────────────────────────────────────
  const finishInterview = useCallback(async () => {
    if (isCompletingRef.current) return;
    isCompletingRef.current = true;
    lockMicRef.current();
    setStatus('speaking');
    try { await completeSession(Number(id)); } catch {}
    speakRef.current(
      'Your interview is complete. Thank you for your time. Redirecting you to your results.',
      () => navigate(`/report/${id}`)
    );
  }, [id, navigate]);

  useEffect(() => { finishInterviewRef.current = finishInterview; }, [finishInterview]);

  // ── NEXT QUESTION ─────────────────────────────────────────────────
  const handleNextQuestion = useCallback(() => {
    const qs = questionsRef.current;
    const idx = currentRef.current;
    if (idx < qs.length - 1) {
      const next = idx + 1;
      setCurrent(next);
      currentRef.current = next;
      processingRef.current = false;
      setTimeout(() => askQuestionRef.current(qs[next]), 400);
    } else {
      finishInterviewRef.current();
    }
  }, []);

  useEffect(() => { handleNextQuestionRef.current = handleNextQuestion; }, [handleNextQuestion]);

  // ── START NO ANSWER TIMER ─────────────────────────────────────────
  const startNoAnswerTimer = useCallback(() => {
    setTimeoutPct(100);
    clearInterval(timeoutIntervalRef.current);
    clearTimeout(noAnswerTimerRef.current);

    let elapsed = 0;
    const step = 200;
    timeoutIntervalRef.current = setInterval(() => {
      elapsed += step;
      setTimeoutPct(100 - (elapsed / NO_ANSWER_TIMEOUT_MS) * 100);
    }, step);

    noAnswerTimerRef.current = setTimeout(() => {
      clearInterval(timeoutIntervalRef.current);
      killRecognitionRef.current();
      handleNextQuestionRef.current();
    }, NO_ANSWER_TIMEOUT_MS);
  }, []);

  useEffect(() => { startNoAnswerTimerRef.current = startNoAnswerTimer; }, [startNoAnswerTimer]);

  // ── AUTO SUBMIT ───────────────────────────────────────────────────
  const handleAutoSubmit = useCallback(async (finalAnswer: string) => {
    if (processingRef.current) return;
    processingRef.current = true;

    clearTimeout(noAnswerTimerRef.current);
    clearInterval(timeoutIntervalRef.current);
    lockMicRef.current();
    setStatus('thinking');

    const q = questionsRef.current[currentRef.current];
    if (!q) return;

    try {
      await submitAnswer(q.id, finalAnswer);
      const evalRes = await evaluateAnswer(q.id, '', '');
      const evalData = (evalRes as any).data?.evaluation;

      if (evalData) {
        setEvaluation(evalData);
        setScores(prev => [...prev, evalData.score]);
        setQuestions(prev =>
          prev.map(item =>
            item.id === q.id
              ? { ...item, candidate_answer: finalAnswer, score: evalData.score, ai_feedback: evalData.feedback }
              : item
          )
        );
        const scoreText = evalData.score >= 7
          ? `Good answer! Score: ${evalData.score} out of 10.`
          : evalData.score >= 4
          ? `Score: ${evalData.score} out of 10. Moving on.`
          : `Score: ${evalData.score} out of 10.`;

        speakRef.current(scoreText, () => {
          setTimeout(() => handleNextQuestionRef.current(), 600);
        });
      } else {
        setTimeout(() => handleNextQuestionRef.current(), 1500);
      }
    } catch (err) {
      console.error('Submit error', err);
      setTimeout(() => handleNextQuestionRef.current(), 1500);
    }
  }, []);

  useEffect(() => { handleAutoSubmitRef.current = handleAutoSubmit; }, [handleAutoSubmit]);

  // ── START LISTENING ───────────────────────────────────────────────
  const startListening = useCallback(() => {
    // ─── HARD GATES ──────────────────────────────────────────────────
    // Never open the mic if Nova is speaking OR if the delay hasn't passed
    if (processingRef.current) return;
    if (isSpeakingRef.current) return;
    if (!micReadyRef.current) return;   // ← KEY FIX: mic blocked until delay elapsed

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) return;

    killRecognitionRef.current(); // abort any stale instance

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';
    recognitionRef.current = recognition;

    recognition.onstart = () => {
      setStatus('listening');
      startNoAnswerTimerRef.current();
    };

    recognition.onresult = (event: any) => {
      // Double-check: if Nova somehow started speaking, discard everything
      if (isSpeakingRef.current || !micReadyRef.current) return;

      let transcript = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        transcript += event.results[i][0].transcript;
      }

      if (transcript.trim().length < 3) return;

      setAnswer(transcript);
      resetNoAnswerTimerRef.current();

      clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = setTimeout(() => {
        if (transcript.trim().length > 5 && !isSpeakingRef.current && micReadyRef.current) {
          recognition.stop();
          handleAutoSubmitRef.current(transcript);
        }
      }, SILENCE_TIMEOUT_MS);
    };

    recognition.onend = () => {
      if (!processingRef.current) setStatus('idle');
    };

    recognition.onerror = (e: any) => {
      if (e.error === 'no-speech') return;
      setStatus('idle');
    };

    recognition.start();
  }, []);

  useEffect(() => { startListeningRef.current = startListening; }, [startListening]);

  // ── ASK QUESTION ──────────────────────────────────────────────────
  const askQuestion = useCallback((q: Question) => {
    setAnswer('');
    setEvaluation(null);
    processingRef.current = false;
    // speak() calls lockMic() internally, then unlockMicAfterDelay before callback
    speakRef.current(q.question_text, () => {
      startListeningRef.current();
    });
  }, []);

  useEffect(() => { askQuestionRef.current = askQuestion; }, [askQuestion]);

  // ── INIT ──────────────────────────────────────────────────────────
  useEffect(() => {
    // Guard: React StrictMode mounts twice in dev — this ensures
    // the intro only ever fires once per session load.
    if (hasStartedRef.current) return;
    hasStartedRef.current = true;

    const init = async () => {
      try {
        const res = await getSession(Number(id));
        const data = (res as any).data;

        // Set all state first, then start TTS after a delay so the
        // loading screen unmounts cleanly before Nova speaks.
        setSession(data.session);
        setQuestions(data.questions);
        questionsRef.current = data.questions;
        setLoading(false);

        const introTimer = setTimeout(() => {
          const firstQuestion = data.questions[0].question_text;
          const fullIntro =
            `Hi ${data.session.candidate_name}. I'm Nova, your AI interviewer. ` +
            `Let's begin your ${data.session.role} interview. ` +
            `Here's your first question. ${firstQuestion}`;

          // speak() → lockMic() before TTS → unlockMicAfterDelay() after →
          // only then opens mic. Intro + Q1 will NEVER repeat.
          speakRef.current(fullIntro, () => {
            startListeningRef.current();
          });
        }, 800);

        // Store timer so cleanup can cancel it if component unmounts mid-delay
        micOpenTimerRef.current = introTimer;

      } catch (err) {
        console.error('Session load error', err);
        setLoading(false);
      }
    };

    init();

    return () => {
      window.speechSynthesis.cancel();
      clearTimeout(silenceTimerRef.current);
      clearTimeout(noAnswerTimerRef.current);
      clearTimeout(micOpenTimerRef.current);
      clearInterval(timeoutIntervalRef.current);
      killRecognitionRef.current();
    };
  }, [id]);

  // ── COMPUTED ──────────────────────────────────────────────────────
  const avgScore = scores.length
    ? (scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(1)
    : '—';

  const getScoreClass = (s: number) => s >= 7 ? 'good' : s >= 4 ? 'mid' : 'bad';

  const statusLabel: Record<string, string> = {
    idle: 'Ready',
    speaking: 'Speaking…',
    listening: 'Listening…',
    thinking: 'Evaluating…',
  };

  const parseArray = (val: any): string[] => {
    if (Array.isArray(val)) return val;
    try { return JSON.parse(val); } catch { return []; }
  };

  // ── LOADING ───────────────────────────────────────────────────────
  if (loading) {
    return (
      <>
        <style>{styles}</style>
        <div className="loading-screen" style={{ background: '#060810' }}>
          <div className="loading-logo">InterviewForge</div>
          <div style={{ fontFamily: "'DM Mono', monospace", fontSize: '0.8rem', color: '#4a5568' }}>
            Preparing your session…
          </div>
          <div className="loading-bar">
            <div className="loading-bar-fill" />
          </div>
        </div>
      </>
    );
  }

  const currentQ = questions[current];
  const progressPct = questions.length ? (current / questions.length) * 100 : 0;

  return (
    <>
      <style>{styles}</style>
      <div className="forge-room">

        {status === 'thinking' && (
          <div className="thinking-overlay">
            <div className="thinking-spinner" />
            <div className="thinking-text">Nova is evaluating your answer…</div>
          </div>
        )}

        <div className="topbar">
          <div className="topbar-brand">
            <div className="logo-dot" />
            Interview<span>Forge</span>
          </div>
          <div className="topbar-meta">
            {session && (
              <>
                <span className="meta-chip role">{session.role}</span>
                <span className="meta-chip diff">{(session as any).experience_level || 'Junior'}</span>
              </>
            )}
            <div className="progress-bar-wrap">
              <span>{current + 1} / {questions.length}</span>
              <div className="progress-track">
                <div className="progress-fill" style={{ width: `${progressPct}%` }} />
              </div>
            </div>
          </div>
        </div>

        <div className="main-body">
          <div className="left-panel">

            <div className="nova-header">
              <div className={`nova-avatar ${status === 'speaking' ? 'nova-speaking' : ''}`}>
                <div className="nova-avatar-core">🤖</div>
                <div className="nova-ring" />
              </div>
              <div className="nova-info">
                <h2>Nova — AI Interviewer</h2>
                <div className="nova-status">
                  <div className={`status-dot ${status}`} />
                  {statusLabel[status]}
                </div>
              </div>
            </div>

            {currentQ && (
              <div className="question-card" key={current}>
                <div className="q-label">Question {current + 1}</div>
                <div className="question-text">{currentQ.question_text}</div>
                {currentQ.category && (
                  <span className={`category-badge ${currentQ.category}`}>
                    {currentQ.category}
                  </span>
                )}
              </div>
            )}

            <div className="answer-section">
              <div className="answer-label">
                <span>Your Answer</span>
                {status === 'listening' && (
                  <div className="wave-bars">
                    {[1, 2, 3, 4, 5].map(i => (
                      <div key={i} className="wave-bar" />
                    ))}
                  </div>
                )}
              </div>
              {answer ? (
                <div className="answer-text">{answer}</div>
              ) : (
                <div className="answer-placeholder">
                  {status === 'listening'
                    ? '🎤 Listening — speak your answer…'
                    : status === 'speaking'
                    ? '🔊 Nova is speaking — mic is off…'
                    : '⏳ Waiting for mic to open…'}
                </div>
              )}
              {status === 'listening' && (
                <div className="timeout-bar-wrap">
                  <div className="timeout-bar" style={{ width: `${timeoutPct}%` }} />
                </div>
              )}
            </div>

            {evaluation && (() => {
              const strengths = parseArray(evaluation.strengths);
              const improvements = parseArray(evaluation.improvements);
              return (
                <div className="eval-card">
                  <div className="eval-header">
                    <span className="eval-title">AI Feedback</span>
                    <span className={`score-badge ${getScoreClass(evaluation.score)}`}>
                      {evaluation.score}/10
                    </span>
                  </div>
                  <div className="eval-feedback">{evaluation.feedback}</div>
                  <div className="eval-tags">
                    {strengths.slice(0, 2).map((s, i) => (
                      <span key={i} className="eval-tag strength">✓ {s}</span>
                    ))}
                    {improvements.slice(0, 2).map((s, i) => (
                      <span key={i} className="eval-tag improve">↑ {s}</span>
                    ))}
                  </div>
                </div>
              );
            })()}

            {status === 'listening' && (
              <button
                className="skip-btn"
                onClick={() => {
                  killRecognitionRef.current();
                  handleNextQuestionRef.current();
                }}
              >
                ⏭ Skip Question
              </button>
            )}
          </div>

          <div className="right-panel">
            <div className="webcam-wrap">
              <Webcam
                audio={false}
                mirrored
                style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
              />
              <div className="webcam-overlay" />
              <div className="webcam-label">{session?.candidate_name || 'Candidate'}</div>
              {status === 'listening' && (
                <div className="rec-indicator">
                  <div className="rec-dot" /> REC
                </div>
              )}
            </div>

            <div className="q-dots">
              {questions.map((_, i) => (
                <div
                  key={i}
                  className={`q-dot ${i < current ? 'done' : i === current ? 'active' : ''}`}
                />
              ))}
            </div>

            <div className="stats-panel">
              <div className="stats-title">Session Stats</div>
              <div className="stats-grid">
                <div className="stat-item">
                  <div className="stat-value">{current + 1}</div>
                  <div className="stat-label">Question</div>
                </div>
                <div className="stat-item">
                  <div className="stat-value">{questions.length}</div>
                  <div className="stat-label">Total</div>
                </div>
                <div className="stat-item">
                  <div className="stat-value" style={{ color: 'var(--accent2)' }}>{scores.length}</div>
                  <div className="stat-label">Answered</div>
                </div>
                <div className="stat-item">
                  <div className="stat-value" style={{
                    color: Number(avgScore) >= 7 ? 'var(--score-good)'
                      : Number(avgScore) >= 4 ? 'var(--score-mid)'
                      : scores.length === 0 ? 'var(--muted)'
                      : 'var(--score-bad)'
                  }}>
                    {avgScore}
                  </div>
                  <div className="stat-label">Avg Score</div>
                </div>
              </div>
            </div>

            <button
              className="skip-btn"
              style={{ width: '100%', justifyContent: 'center' }}
              onClick={() => finishInterviewRef.current()}
            >
              ✓ End Interview Early
            </button>
          </div>
        </div>
      </div>
    </>
  );
}