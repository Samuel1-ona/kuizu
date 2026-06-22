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

  // GET /api/game/progress/:wallet — get player's current level
  router.get("/progress/:wallet", async (req, res) => {
    const wallet = req.params.wallet.toLowerCase();

    const { data } = await supabase
      .from("player_progress")
      .select("current_level")
      .eq("wallet_address", wallet)
      .single();

    res.json({ currentLevel: data?.current_level ?? 1, wallet });
  });

  // POST /api/game/start — create session for a specific level
  router.post("/start", async (req, res) => {
    const { wallet, level = 1 } = req.body;
    const levelNum = Number(level);

    if (!Number.isInteger(levelNum) || levelNum < 1 || levelNum > 100) {
      return res.status(400).json({ error: "Level must be 1–100" });
    }

    // Levels 1–10 map to difficulty 1–10, levels 11+ use difficulty 10
    const difficulty = Math.min(levelNum, 10);

    // Validate player has unlocked this level
    if (wallet) {
      const { data: progress } = await supabase
        .from("player_progress")
        .select("current_level")
        .eq("wallet_address", wallet.toLowerCase())
        .single();

      const currentLevel = progress?.current_level ?? 1;
      if (levelNum > currentLevel) {
        return res.status(403).json({ error: `Level ${levelNum} is locked. Your current level is ${currentLevel}.` });
      }
    }

    // Fetch questions for this difficulty (levels 11+ reuse difficulty 10)
    const { data: allQuestions, error: qErr } = await supabase
      .from("questions")
      .select("q, options, answer, category")
      .eq("difficulty", difficulty);

    if (qErr || !allQuestions?.length) {
      return res.status(404).json({ error: `No questions available for difficulty ${difficulty}` });
    }

    if (allQuestions.length < config.questionsPerGame) {
      return res.status(404).json({ error: `Not enough questions for difficulty ${difficulty} (need ${config.questionsPerGame}, have ${allQuestions.length})` });
    }

    const picked = shuffle(allQuestions).slice(0, config.questionsPerGame);

    const { data: session, error: sErr } = await supabase
      .from("game_sessions")
      .insert({ questions: picked, level: levelNum })
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
      level: levelNum,
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

  // POST /api/game/end — finalize session, handle level progression
  router.post("/end", async (req, res) => {
    const { sessionId, wallet } = req.body;

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

    const { score } = session;
    const total = session.questions.length;
    const passed = score >= config.passingScore;
    const level = session.level || 1;
    let levelUp = false;
    let currentLevel = level;

    // Handle level progression if player passed and wallet provided
    if (passed && wallet) {
      const walletLower = wallet.toLowerCase();

      const { data: progress } = await supabase
        .from("player_progress")
        .select("current_level")
        .eq("wallet_address", walletLower)
        .single();

      currentLevel = progress?.current_level ?? 1;

      if (level >= currentLevel) {
        const newLevel = currentLevel + 1;
        await supabase
          .from("player_progress")
          .upsert({
            wallet_address: walletLower,
            current_level: newLevel,
            updated_at: new Date().toISOString(),
          });
        currentLevel = newLevel;
        levelUp = true;
      }
    }

    await supabase
      .from("game_sessions")
      .delete()
      .eq("id", sessionId);

    res.json({
      score,
      total,
      passed,
      passingScore: config.passingScore,
      level,
      levelUp,
      currentLevel,
    });
  });

  return router;
}
