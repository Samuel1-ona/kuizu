import { createContext, useContext, useState, useCallback, type ReactNode } from "react";
import { apiStartGame, apiSubmitAnswer, apiEndGame } from "../services/api";
import { QUESTIONS } from "../constants/questions";
import { useWallet } from "./WalletContext";
import { useScreen } from "./ScreenContext";
import type { Question } from "../types";

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

interface GameContextValue {
  sessionId: string | null;
  questions: Question[];
  questionIndex: number;
  score: number;
  answerLocked: boolean;
  correctAnswer: number | null;
  chosenAnswer: number | null;
  lastScore: number;
  lastWon: boolean;
  startGame: () => Promise<void>;
  pickAnswer: (chosen: number) => Promise<void>;
  timeUp: () => Promise<void>;
  nextQuestion: () => void;
}

const GameContext = createContext<GameContextValue>(null!);

export function GameProvider({ children }: { children: ReactNode }) {
  const { contract, contractDeployed, gameConfig, refreshStats } = useWallet();
  const { showScreen, showLoading } = useScreen();

  const [sessionId, setSessionId] = useState<string | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [answerLocked, setAnswerLocked] = useState(false);
  const [correctAnswer, setCorrectAnswer] = useState<number | null>(null);
  const [chosenAnswer, setChosenAnswer] = useState<number | null>(null);
  const [lastScore, setLastScore] = useState(0);
  const [lastWon, setLastWon] = useState(false);

  const startGame = useCallback(async () => {
    showLoading("Starting game…");

    if (contractDeployed && contract) {
      try {
        showLoading("Confirm in wallet…");
        const tx = await contract.startGame();
        showLoading("Waiting for confirmation…");
        await tx.wait();
      } catch (err: unknown) {
        const code = (err as { code?: number | string })?.code;
        if (code === 4001 || code === "ACTION_REJECTED") {
          showScreen("menu");
          return;
        }
        console.warn("startGame tx failed:", (err as Error).message);
      }
    }

    let newSessionId: string | null = null;
    let newQuestions: Question[];

    try {
      showLoading("Loading questions…");
      const data = await apiStartGame();
      newSessionId = data.sessionId;
      newQuestions = data.questions;
    } catch (err) {
      console.warn("API unavailable, using local questions:", (err as Error).message);
      newQuestions = shuffle(QUESTIONS).slice(0, gameConfig.totalQuestions);
    }

    setSessionId(newSessionId);
    setQuestions(newQuestions);
    setQuestionIndex(0);
    setScore(0);
    setAnswerLocked(false);
    setCorrectAnswer(null);
    setChosenAnswer(null);
    showScreen("game");
  }, [contract, contractDeployed, gameConfig.totalQuestions, showLoading, showScreen]);

  const submitScore = useCallback(async (finalScore: number, passed: boolean) => {
    showLoading("Submitting score…");

    if (contractDeployed && contract) {
      try {
        showLoading("Confirm in wallet…");
        const tx = await contract.endGame(finalScore);
        showLoading("Recording on-chain…");
        await tx.wait();
        await refreshStats();
      } catch (err: unknown) {
        const code = (err as { code?: number | string })?.code;
        if (code !== 4001 && code !== "ACTION_REJECTED") {
          console.warn("endGame tx failed:", (err as Error).message);
        }
      }
    }

    setLastScore(finalScore);
    setLastWon(passed);
    showScreen(passed ? "win" : "lose");
  }, [contract, contractDeployed, refreshStats, showLoading, showScreen]);

  const pickAnswer = useCallback(async (chosen: number) => {
    if (answerLocked) return;
    setAnswerLocked(true);
    setChosenAnswer(chosen);

    if (sessionId) {
      try {
        const data = await apiSubmitAnswer(sessionId, chosen);
        setCorrectAnswer(data.correctAnswer);
        if (data.correct) setScore(data.score);
      } catch (err) {
        console.error("Answer validation failed:", err);
      }
    } else {
      const q = questions[questionIndex] as Question & { answer?: number };
      const correct = q.answer ?? 0;
      setCorrectAnswer(correct);
      if (chosen === correct) setScore(s => s + 1);
    }
  }, [answerLocked, sessionId, questions, questionIndex]);

  const timeUp = useCallback(async () => {
    if (answerLocked) return;
    setAnswerLocked(true);
    setChosenAnswer(-1);

    if (sessionId) {
      try {
        const data = await apiSubmitAnswer(sessionId, -1);
        setCorrectAnswer(data.correctAnswer);
      } catch (err) {
        console.error("Timeout submission failed:", err);
      }
    } else {
      const q = questions[questionIndex] as Question & { answer?: number };
      setCorrectAnswer(q.answer ?? 0);
    }
  }, [answerLocked, sessionId, questions, questionIndex]);

  const nextQuestion = useCallback(() => {
    const nextIdx = questionIndex + 1;
    if (nextIdx >= gameConfig.totalQuestions) {
      let finalScore = score;
      let passed = score >= gameConfig.passingScore;

      if (sessionId) {
        apiEndGame(sessionId).then(data => {
          finalScore = data.score;
          passed = data.passed;
          setSessionId(null);
          submitScore(finalScore, passed);
        }).catch(() => {
          setSessionId(null);
          submitScore(finalScore, passed);
        });
      } else {
        submitScore(finalScore, passed);
      }
      return;
    }

    setQuestionIndex(nextIdx);
    setAnswerLocked(false);
    setCorrectAnswer(null);
    setChosenAnswer(null);
  }, [questionIndex, gameConfig, score, sessionId, submitScore]);

  return (
    <GameContext.Provider value={{
      sessionId, questions, questionIndex, score,
      answerLocked, correctAnswer, chosenAnswer,
      lastScore, lastWon,
      startGame, pickAnswer, timeUp, nextQuestion,
    }}>
      {children}
    </GameContext.Provider>
  );
}

export function useGame() {
  return useContext(GameContext);
}
