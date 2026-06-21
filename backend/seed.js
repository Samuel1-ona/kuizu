import "dotenv/config";
import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "fs";

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY,
);

const questions = JSON.parse(readFileSync(new URL("./questions.json", import.meta.url), "utf-8"));

const { count } = await supabase.from("questions").select("*", { count: "exact", head: true });

if (count > 0) {
  console.log(`questions table already has ${count} rows — skipping seed.`);
  process.exit(0);
}

const { data, error } = await supabase.from("questions").insert(questions).select();

if (error) {
  console.error("Seed failed:", error.message);
  console.error("Did you run the migration SQL in the Supabase dashboard first?");
  process.exit(1);
}

console.log(`Seeded ${data.length} questions into Supabase.`);
