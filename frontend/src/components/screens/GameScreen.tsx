import { useEffect, useRef } from "react";
import { useGame } from "../../contexts/GameContext";
import { useTimer } from "../../hooks/useTimer";
import { useWallet } from "../../contexts/WalletContext";

const LETTERS = ["A", "B", "C", "D"];

export function GameScreen() {
  const {
    questions, questionIndex, score, answerLocked, correctAnswer, chosenAnswer, level,
    sessionId, hint, hintLoading, hintsRemaining, explanation, explanationLoading,
    showingExplanation, pickAnswer, timeUp, nextQuestion, fetchHint, fetchExplanation, closeExplanation,
  } = useGame();
  const { gameConfig } = useWallet();
  const timerActive = !answerLocked && questions.length > 0;
  const { timeLeft, pct, color } = useTimer(timerActive, timeUp);
  const advanceTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const q = questions[questionIndex];

  // Auto-advance after answer is revealed, paused while explanation is open
  useEffect(() => {
    if (correctAnswer === null || showingExplanation) return;
    const delay = chosenAnswer !== null && chosenAnswer >= 0 && chosenAnswer === correctAnswer ? 600 : 1100;
    advanceTimer.current = setTimeout(nextQuestion, delay);
    return () => clearTimeout(advanceTimer.current);
  }, [correctAnswer, chosenAnswer, nextQuestion, showingExplanation]);

  if (!q) return null;

  const showHintBtn = !!sessionId && !answerLocked;
  const showWhyBtn = correctAnswer !== null && !!sessionId;

  return (
    <div className="screen active" style={{ padding: "16px 16px 32px", justifyContent: "flex-start" }}>
      <div className="game-header">
        <div className="progress-track">
          <div className="progress-fill" style={{ width: `${(questionIndex / gameConfig.totalQuestions) * 100}%` }} />
        </div>
        <div className="game-meta">
          <span>Lv.{level} — Q {questionIndex + 1} / {gameConfig.totalQuestions}</span>
          <span className="category-tag">{q.category}</span>
          <span className="game-score-live">Score: {score}</span>
        </div>
        <div className="timer-row">
          <span className="timer-num">{timeLeft}</span>
          <div className="timer-track">
            <div className={`timer-fill ${color}`} style={{ width: `${pct}%` }} />
          </div>
        </div>
      </div>

      <div className="question-card">
        <div className="question-text">{q.q}</div>
      </div>

      {hint && (
        <div className="hint-box">
          <span className="hint-icon">💡</span>
          <span className="hint-text">{hint}</span>
        </div>
      )}

      <div className="options-grid">
        {q.options.map((opt, i) => {
          let cls = "option-btn";
          if (correctAnswer !== null && i === correctAnswer) cls += " correct";
          if (chosenAnswer !== null && i === chosenAnswer && chosenAnswer !== correctAnswer) cls += " wrong";
          return (
            <button
              key={i}
              className={cls}
              disabled={answerLocked}
              onClick={() => pickAnswer(i)}
            >
              <span className="option-letter">{LETTERS[i]}</span>
              <span>{opt}</span>
            </button>
          );
        })}
      </div>

      <div className="ai-action-row">
        {showHintBtn && (
          <button
            className="ai-btn hint-btn"
            disabled={hintsRemaining <= 0 || hintLoading}
            onClick={fetchHint}
          >
            {hintLoading ? "…" : `💡 Hint (${hintsRemaining} left)`}
          </button>
        )}
        {showWhyBtn && (
          <button className="ai-btn why-btn" onClick={fetchExplanation}>
            Why?
          </button>
        )}
      </div>

      {showingExplanation && (
        <div className="explanation-overlay" onClick={closeExplanation}>
          <div className="explanation-modal" onClick={e => e.stopPropagation()}>
            <div className="explanation-header">
              <span>Why is this correct?</span>
              <button className="explanation-close" onClick={closeExplanation}>×</button>
            </div>
            <div className="explanation-answer">
              {q.options[correctAnswer!]}
            </div>
            {explanationLoading ? (
              <div className="explanation-loading">Thinking…</div>
            ) : (
              <p className="explanation-body">{explanation}</p>
            )}
            <button className="ai-btn why-btn" style={{ marginTop: 16 }} onClick={closeExplanation}>
              Got it
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
