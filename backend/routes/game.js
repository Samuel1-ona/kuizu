import { Router } from "express";

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export default function gameRouter(supabase, config) {
  const router = Router();

  // POST /api/game/start — pick random questions, create session
  router.post("/start", async (req, res) => {
    const { data: allQuestions, error: qErr } = await supabase
      .from("questions")
      .select("q, options, answer, category");

    if (qErr || !allQuestions?.length) {
      return res.status(500).json({ error: "Failed to load questions" });
    }

    const picked = shuffle(allQuestions).slice(0, config.questionsPerGame);

    const { data: session, error: sErr } = await supabase
      .from("game_sessions")
      .insert({ questions: picked })
      .select("id")
      .single();

    if (sErr) {
      return res.status(500).json({ error: "Failed to create session" });
    }

    res.json({
      sessionId: session.id,
      questions: picked.map(({ q, options, category }) => ({ q, options, category })),
      total: config.questionsPerGame,
      timePerQuestion: config.timePerQuestion,
    });
  });

  // POST /api/game/answer — validate one answer
  router.post("/answer", async (req, res) => {
    const { sessionId, answer } = req.body;

    if (!sessionId || answer === undefined) {
      return res.status(400).json({ error: "Missing sessionId or answer" });
    }

    const answerInt = Number(answer);
    if (!Number.isInteger(answerInt) || answerInt < -1 || answerInt > 3) {
      return res.status(400).json({ error: "answer must be an integer from -1 to 3" });
    }

    const { data: session, error } = await supabase
      .from("game_sessions")
      .select("*")
      .eq("id", sessionId)
      .single();

    if (error || !session) {
      return res.status(404).json({ error: "Session not found or expired" });
    }
    if (session.completed) {
      return res.status(409).json({ error: "Session already completed" });
    }
    if (session.answer_index >= session.questions.length) {
      return res.status(400).json({ error: "All questions already answered" });
    }

    const currentQ = session.questions[session.answer_index];
    const correct = answerInt >= 0 && answerInt === currentQ.answer;
    const newScore = correct ? session.score + 1 : session.score;
    const newIndex = session.answer_index + 1;

    await supabase
      .from("game_sessions")
      .update({ score: newScore, answer_index: newIndex })
      .eq("id", sessionId);

    res.json({
      correct,
      correctAnswer: currentQ.answer,
      score: newScore,
      questionsLeft: session.questions.length - newIndex,
    });
  });

  // POST /api/game/end — finalize session, return validated score
  router.post("/end", async (req, res) => {
    const { sessionId } = req.body;

    if (!sessionId) {
      return res.status(400).json({ error: "Missing sessionId" });
    }

    const { data: session, error } = await supabase
      .from("game_sessions")
      .select("*")
      .eq("id", sessionId)
      .single();

    if (error || !session) {
      return res.status(404).json({ error: "Session not found or expired" });
    }
    if (session.completed) {
      return res.status(409).json({ error: "Session already completed" });
    }

    await supabase
      .from("game_sessions")
      .delete()
      .eq("id", sessionId);

    res.json({
      score: session.score,
      total: session.questions.length,
      passed: session.score >= config.passingScore,
      passingScore: config.passingScore,
    });
  });

  return router;
}
