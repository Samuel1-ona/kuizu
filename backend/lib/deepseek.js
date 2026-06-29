const BASE_URL = "https://api.deepseek.com/chat/completions";

export async function callDeepSeek(messages, maxTokens = 200) {
  const apiKey = process.env.DEEPSEEK_API_KEY;
  if (!apiKey) throw new Error("DEEPSEEK_API_KEY not configured");

  const res = await fetch(BASE_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "deepseek-chat",
      messages,
      max_tokens: maxTokens,
      temperature: 0.7,
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message || `DeepSeek error ${res.status}`);
  }

  const data = await res.json();
  return data.choices[0].message.content.trim();
}

export async function generateQuestions(level, count = 10) {
  const difficulty = Math.min(level, 10);
  const difficultyLabel =
    level <= 2 ? "very easy beginner" :
    level <= 4 ? "easy" :
    level <= 6 ? "medium" :
    level <= 8 ? "hard" : "very hard expert";

  const raw = await callDeepSeek([
    {
      role: "system",
      content: `You are a trivia question generator. Generate exactly ${count} unique trivia questions at ${difficultyLabel} difficulty. Return ONLY a valid JSON array with no markdown, code fences, or extra text. Each element must have exactly these fields: {"q": "question text", "options": ["A", "B", "C", "D"], "answer": <0-3>, "category": "Category Name", "difficulty": ${difficulty}}. The answer field is the 0-based index of the correct option.`,
    },
    {
      role: "user",
      content: `Generate ${count} trivia questions for level ${level}.`,
    },
  ], 4000);

  const questions = JSON.parse(raw);
  if (!Array.isArray(questions)) throw new Error("DeepSeek returned invalid question format");
  return questions.slice(0, count);
}
