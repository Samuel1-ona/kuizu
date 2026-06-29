# KUIZU — Web3 Trivia on Celo

> Answer questions. Earn crypto. Level up. Repeat.

**Kuizu** is a blockchain-powered trivia game built on the Celo network. Players answer 10 questions per round, earn real GoodDollar (G$) UBI rewards for winning, and climb 100 progressively harder levels — all assisted by DeepSeek AI.

Live at → **https://kuizu-mu.vercel.app**

---

## How It Works

| Step | Action |
|------|--------|
| 1️⃣ | Connect your wallet via Web3Auth (email or social login — no seed phrase needed) |
| 2️⃣ | Pick a level (1–100). Each level unlocks after winning the previous one |
| 3️⃣ | Answer 10 trivia questions — 20 seconds per question |
| 4️⃣ | Score 7/10 or higher to pass and claim your daily G$ UBI reward |
| 5️⃣ | Level up, climb the leaderboard, repeat daily |

---

## Key Features

### 🤖 DeepSeek AI Integration
- **AI Hint Lifeline** — 2 hints per game. Get a subtle clue without having the answer spoiled
- **Post-Answer Explanations** — tap "Why?" after any question to get a 2–3 sentence AI explanation of the correct answer
- **Dynamic Question Generation** — DeepSeek generates fresh questions on demand when the database runs low, so the bank never runs dry

### 🌍 GoodDollar UBI Rewards
- Pass a round (7/10+) and claim real **G$ tokens** — GoodDollar's Universal Basic Income
- Sybil resistance enforced by GoodDollar's on-chain identity contract
- One claim per verified wallet per day

### ⛓️ On-Chain Score Recording
- Every game result is recorded on the **Celo blockchain** via a Solidity smart contract
- Scores and level progression are transparent and tamper-proof
- Global leaderboard pulls directly from the chain

### 🏆 100-Level Progression System
- Levels 1–10 scale from easy → expert difficulty
- Levels 11–100 layer increasing complexity on top of difficulty 10
- Unlock levels sequentially — no skipping

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Blockchain | Celo (EVM-compatible, low fees) |
| Smart Contracts | Solidity + Foundry |
| Frontend | React 19 + Vite + TypeScript |
| Wallet Auth | Web3Auth (social/email login) |
| AI | DeepSeek Chat API |
| UBI Rewards | GoodDollar G$ |
| Backend | Node.js + Express |
| Database | Supabase (PostgreSQL) |
| Hosting | Vercel (frontend) + Render (API) |

---

## Smart Contract

Deployed on **Celo Mainnet** at `0x66778ebA2d9cc857ea39fbb8e2e54238918B221C`

```
startGame()   → opens a new game session on-chain
endGame(score) → records result and updates leaderboard
getLeaderboard(limit) → returns top players sorted by score
```

Passing score: **7 / 10**

---

## Project Structure

```
kuizu/
├── contracts/        # Solidity smart contract (Foundry)
├── backend/          # Express API + Supabase + DeepSeek AI
│   ├── routes/
│   │   ├── game.js   # Game session, answers, scoring
│   │   └── ai.js     # Hint & explanation endpoints
│   └── lib/
│       └── deepseek.js  # DeepSeek API utility
└── frontend/         # React + Vite app
    └── src/
        ├── components/screens/   # Game, Menu, Win, Lose, etc.
        ├── contexts/             # GameContext, WalletContext, etc.
        └── services/             # API + AI service calls
```

---

## Roadmap

- [ ] Multiplayer real-time quiz battles
- [ ] Category-specific question packs (Crypto, Science, History…)
- [ ] NFT badges for reaching milestone levels
- [ ] Mobile app via MiniPay wallet integration
- [ ] Tournament mode with G$ prize pools

---

## Built By

**Samuel Ona** · [GitHub](https://github.com/Samuel1-ona/kuizu)

Built for the Celo ecosystem · Powered by GoodDollar UBI · AI by DeepSeek
