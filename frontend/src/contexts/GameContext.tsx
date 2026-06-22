import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from "react";
import { apiStartGame, apiSubmitAnswer, apiEndGame, apiGetProgress } from "../services/api";
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
  level: number;
  currentLevel: number;
  levelUp: boolean;
  startGame: (level: number) => Promise<void>;
  pickAnswer: (chosen: number) => Promise<void>;
  timeUp: () => Promise<void>;
  nextQuestion: () => void;
  loadProgress: () => Promise<void>;
}

const GameContext = createContext<GameContextValue>(null!);

export function GameProvider({ children }: { children: ReactNode }) {
  const { contract, contractDeployed, gameConfig, refreshStats, address } = useWallet();
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
  const [level, setLevel] = useState(1);
  const [currentLevel, setCurrentLevel] = useState(1);
  const [levelUp, setLevelUp] = useState(false);

  const loadProgress = useCallback(async () => {
    if (!address) return;
    try {
      const data = await apiGetProgress(address);
      setCurrentLevel(data.currentLevel);
    } catch {
      setCurrentLevel(1);
    }
  }, [address]);

  useEffect(() => {
    if (address) loadProgress();
  }, [address, loadProgress]);

  const startGame = useCallback(async (selectedLevel: number) => {
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
          showScreen("levelselect");
          return;
        }
        console.warn("startGame tx failed:", (err as Error).message);
      }
    }

    let newSessionId: string | null = null;
    let newQuestions: Question[];

    try {
      showLoading("Loading questions…");
      const data = await apiStartGame(selectedLevel, address || undefined);
      newSessionId = data.sessionId;
      newQuestions = data.questions;
    } catch (err) {
      console.warn("API unavailable, using local questions:", (err as Error).message);
      const filtered = QUESTIONS.filter(q => q.difficulty === selectedLevel);
      newQuestions = shuffle(filtered.length >= 10 ? filtered : QUESTIONS).slice(0, gameConfig.totalQuestions);
    }

    setSessionId(newSessionId);
    setQuestions(newQuestions);
    setQuestionIndex(0);
    setScore(0);
    setAnswerLocked(false);
    setCorrectAnswer(null);
    setChosenAnswer(null);
    setLevel(selectedLevel);
    setLevelUp(false);
    showScreen("game");
  }, [contract, contractDeployed, gameConfig.totalQuestions, address, showLoading, showScreen]);

  const submitScore = useCallback(async (finalScore: number, passed: boolean, didLevelUp: boolean, newCurrentLevel: number) => {
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
    setLevelUp(didLevelUp);
    if (didLevelUp) setCurrentLevel(newCurrentLevel);
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
      if (sessionId) {
        apiEndGame(sessionId, address || undefined).then(data => {
          setSessionId(null);
          submitScore(data.score, data.passed, data.levelUp, data.currentLevel);
        }).catch(() => {
          setSessionId(null);
          submitScore(score, score >= gameConfig.passingScore, false, currentLevel);
        });
      } else {
        submitScore(score, score >= gameConfig.passingScore, false, currentLevel);
      }
      return;
    }

    setQuestionIndex(nextIdx);
    setAnswerLocked(false);
    setCorrectAnswer(null);
    setChosenAnswer(null);
  }, [questionIndex, gameConfig, score, sessionId, address, currentLevel, submitScore]);

  return (
    <GameContext.Provider value={{
      sessionId, questions, questionIndex, score,
      answerLocked, correctAnswer, chosenAnswer,
      lastScore, lastWon, level, currentLevel, levelUp,
      startGame, pickAnswer, timeUp, nextQuestion, loadProgress,
    }}>
      {children}
    </GameContext.Provider>
  );
}

export function useGame() {
  return useContext(GameContext);
}
