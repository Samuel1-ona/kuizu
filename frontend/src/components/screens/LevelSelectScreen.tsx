import { useRef, useEffect } from "react";
import { Button } from "../ui/Button";
import { useGame } from "../../contexts/GameContext";
import { useScreen } from "../../contexts/ScreenContext";

const MAX_LEVEL = 100;

function getDifficultyLabel(level: number): string {
  const d = Math.min(level, 10);
  const labels: Record<number, string> = {
    1: "Easy", 2: "Medium Easy", 3: "Medium", 4: "Medium Hard", 5: "Hard",
    6: "Very Hard", 7: "Expert", 8: "Master", 9: "Legend", 10: "Ultimate",
  };
  return labels[d] || "Ultimate";
}

export function LevelSelectScreen() {
  const { currentLevel, startGame } = useGame();
  const { showScreen } = useScreen();
  const currentRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    currentRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
  }, []);

  return (
    <div className="screen active" style={{ justifyContent: "flex-start" }}>
      <div className="lb-header">
        <Button variant="back" onClick={() => showScreen("menu")}>← Back</Button>
        <h2>Select Level</h2>
      </div>

      <div className="level-grid">
        {Array.from({ length: MAX_LEVEL }, (_, i) => i + 1).map(lvl => {
          const unlocked = lvl <= currentLevel;
          const completed = lvl < currentLevel;
          const isCurrent = lvl === currentLevel;

          return (
            <button
              key={lvl}
              ref={isCurrent ? currentRef : undefined}
              className={`level-card ${unlocked ? "unlocked" : "locked"} ${completed ? "completed" : ""} ${isCurrent ? "current" : ""}`}
              disabled={!unlocked}
              onClick={() => startGame(lvl)}
            >
              <span className="level-num">{unlocked ? lvl : "🔒"}</span>
              <span className="level-label">{getDifficultyLabel(lvl)}</span>
              {completed && <span className="level-check">✓</span>}
            </button>
          );
        })}
      </div>
    </div>
  );
}
