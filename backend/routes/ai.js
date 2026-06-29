import { Router } from "express";
import { callDeepSeek } from "../lib/deepseek.js";

const MAX_HINTS = 2;
// in-memory hint usage tracker; bounded by active sessions
const hintTracker = new Map();

export default function aiRouter(supabase) {
  const router = Router();

  // POST /api/ai/hint
  router.post("/hint", async (req, res) => {
    try {
      const { sessionId, questionIndex } = req.body;
      if (!sessionId || questionIndex === undefined) {
        return res.status(400).json({ error: "Missing sessionId or questionIndex" });
      }

      const used = hintTracker.get(sessionId) || 0;
      if (used >= MAX_HINTS) {
        return res.status(429).json({ error: "No hints remaining", hintsRemaining: 0 });
      }

      const { data: session, error } = await supabase
        .from("game_sessions")
        .select("questions, completed")
        .eq("id", sessionId)
        .single();

      if (error || !session) return res.status(404).json({ error: "Session not found" });
      if (session.completed) return res.status(409).json({ error: "Session already completed" });

      const q = session.questions[questionIndex];
      if (!q) return res.status(400).json({ error: "Invalid question index" });

      const hint = await callDeepSeek([
        {
          role: "system",
          content: "You are a trivia game assistant. Give a subtle hint for the question without revealing the answer. Use 1–2 sentences. Focus on narrowing down possibilities or offering a relevant fact.",
        },
        {
          role: "user",
          content: `Question: ${q.q}\nOptions: ${q.options.map((o, i) => `${i + 1}. ${o}`).join(" | ")}\n\nGive a subtle hint.`,
        },
      ], 120);

      hintTracker.set(sessionId, used + 1);
      res.json({ hint, hintsRemaining: MAX_HINTS - used - 1 });
    } catch (err) {
      console.error("Hint error:", err);
      res.status(500).json({ error: "Failed to generate hint" });
    }
  });

  // DELETE hint entry when session ends (called internally by game router)
  router.cleanupSession = (sessionId) => hintTracker.delete(sessionId);

  // POST /api/ai/explain
  router.post("/explain", async (req, res) => {
    try {
      const { question, options, correctAnswer } = req.body;
      if (!question || !Array.isArray(options) || correctAnswer === undefined) {
        return res.status(400).json({ error: "Missing required fields" });
      }

      const explanation = await callDeepSeek([
        {
          role: "system",
          content: "You are a trivia educator. Explain in 2–3 concise sentences why the given answer is correct. Be informative and engaging.",
        },
        {
          role: "user",
          content: `Question: ${question}\nCorrect answer: ${options[correctAnswer]}\n\nWhy is this correct?`,
        },
      ], 200);

      res.json({ explanation });
    } catch (err) {
      console.error("Explain error:", err);
      res.status(500).json({ error: "Failed to generate explanation" });
    }
  });

  return router;
}
