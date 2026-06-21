import { API_URL } from "../constants/config";
import type { StartGameResponse, AnswerResponse, EndGameResponse } from "../types";

export async function apiStartGame(): Promise<StartGameResponse> {
  const res = await fetch(`${API_URL}/api/game/start`, { method: "POST" });
  if (!res.ok) throw new Error("Failed to start game");
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

export async function apiEndGame(sessionId: string): Promise<EndGameResponse> {
  const res = await fetch(`${API_URL}/api/game/end`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ sessionId }),
  });
  if (!res.ok) throw new Error("Failed to end game");
  return res.json();
}
