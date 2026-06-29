import { API_URL } from "../constants/config";

export async function apiGetHint(
  sessionId: string,
  questionIndex: number,
): Promise<{ hint: string; hintsRemaining: number }> {
  const res = await fetch(`${API_URL}/api/ai/hint`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ sessionId, questionIndex }),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error((data as { error?: string }).error || "Failed to get hint");
  }
  return res.json();
}

export async function apiGetExplanation(
  question: string,
  options: string[],
  correctAnswer: number,
): Promise<{ explanation: string }> {
  const res = await fetch(`${API_URL}/api/ai/explain`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ question, options, correctAnswer }),
  });
  if (!res.ok) throw new Error("Failed to get explanation");
  return res.json();
}
