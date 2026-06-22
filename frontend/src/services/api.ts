import { API_URL } from "../constants/config";
import type { StartGameResponse, AnswerResponse, EndGameResponse, ProgressResponse } from "../types";

export async function apiGetProgress(wallet: string): Promise<ProgressResponse> {
  const res = await fetch(`${API_URL}/api/game/progress/${wallet.toLowerCase()}`);
  if (!res.ok) throw new Error("Failed to get progress");
  return res.json();
}

export async function apiStartGame(level: number, wallet?: string): Promise<StartGameResponse> {
  const res = await fetch(`${API_URL}/api/game/start`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ level, wallet }),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || "Failed to start game");
  }
  return res.json();
}

export async function apiSubmitAnswer(sessionId: string, answer: number): Promise<AnswerResponse> {
  const res = await fetch(`${API_URL}/api/game/answer`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ sessionId, answer }),
  });
  if (!res.ok) throw new Error("Failed to submit answer");
  return res.json();
}

export async function apiEndGame(sessionId: string, wallet?: string): Promise<EndGameResponse> {
  const res = await fetch(`${API_URL}/api/game/end`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ sessionId, wallet }),
  });
  if (!res.ok) throw new Error("Failed to end game");
  return res.json();
}
