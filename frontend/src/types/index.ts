export type ScreenId =
  | "loading"
  | "connect"
  | "menu"
  | "levelselect"
  | "game"
  | "win"
  | "lose"
  | "leaderboard"
  | "username"
  | "error";

export interface Question {
  q: string;
  options: string[];
  category: string;
}

export interface LocalQuestion extends Question {
  answer: number;
  difficulty: number;
}

export interface StartGameResponse {
  sessionId: string;
  questions: Question[];
  total: number;
  timePerQuestion: number;
  level: number;
}

export interface AnswerResponse {
  correct: boolean;
  correctAnswer: number;
  score: number;
  questionsLeft: number;
}

export interface EndGameResponse {
  score: number;
  total: number;
  passed: boolean;
  passingScore: number;
  level: number;
  levelUp: boolean;
  currentLevel: number;
}

export interface ProgressResponse {
  currentLevel: number;
  wallet: string;
}

export type IdentityStatusValue = "verified" | "unverified" | "expired" | "unknown" | "checking";

export interface IdentityStatus {
  status: IdentityStatusValue;
  root?: string | null;
}

export interface PlayerStats {
  gamesPlayed: number;
  gamesWon: number;
  lastPlayedAt: number;
  highScore: number;
  hasPlayed: boolean;
}

export interface GameConfig {
  totalQuestions: number;
  passingScore: number;
}
