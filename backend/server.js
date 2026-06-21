import "dotenv/config";
import express from "express";
import cors from "cors";
import { createClient } from "@supabase/supabase-js";
import gameRouter from "./routes/game.js";

const app = express();
const PORT = process.env.PORT || 3001;
const SESSION_TTL = Number(process.env.SESSION_TTL_MS) || 300_000;

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY,
);

app.use(cors({ origin: process.env.CORS_ORIGIN || "*" }));
app.use(express.json());

app.use("/api/game", gameRouter(supabase, {
  questionsPerGame: Number(process.env.QUESTIONS_PER_GAME) || 10,
  passingScore:     Number(process.env.PASSING_SCORE) || 7,
  timePerQuestion:  Number(process.env.TIME_PER_QUESTION) || 20,
  sessionTtl:       SESSION_TTL,
}));

// Clean up expired sessions every 60s
setInterval(async () => {
  const cutoff = new Date(Date.now() - SESSION_TTL).toISOString();
  await supabase.from("game_sessions").delete().lt("created_at", cutoff);
}, 60_000);

app.listen(PORT, () => console.log(`Kuizu API running on :${PORT}`));
