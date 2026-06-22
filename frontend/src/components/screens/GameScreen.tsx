import { useEffect, useRef } from "react";
import { useGame } from "../../contexts/GameContext";
import { useTimer } from "../../hooks/useTimer";
import { useWallet } from "../../contexts/WalletContext";

const LETTERS = ["A", "B", "C", "D"];

export function GameScreen() {
  const { questions, questionIndex, score, answerLocked, correctAnswer, chosenAnswer, level, pickAnswer, timeUp, nextQuestion } = useGame();
  const { gameConfig } = useWallet();
  const timerActive = !answerLocked && questions.length > 0;
  const { timeLeft, pct, color } = useTimer(timerActive, timeUp);
  const advanceTimer = useRef<ReturnType<typeof setTimeout>>();

  const q = questions[questionIndex];

  useEffect(() => {
    if (correctAnswer === null) return;
    const delay = chosenAnswer !== null && chosenAnswer >= 0 && chosenAnswer === correctAnswer ? 600 : 1100;
    advanceTimer.current = setTimeout(nextQuestion, delay);
    return () => clearTimeout(advanceTimer.current);
  }, [correctAnswer, chosenAnswer, nextQuestion]);

  if (!q) return null;

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
    </div>
  );
}
