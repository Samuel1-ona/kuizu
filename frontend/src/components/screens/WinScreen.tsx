import { Button } from "../ui/Button";
import { ClaimButton } from "../ui/ClaimButton";
import { useGame } from "../../contexts/GameContext";
import { useWallet } from "../../contexts/WalletContext";
import { useGoodDollar } from "../../contexts/GoodDollarContext";
import { useScreen } from "../../contexts/ScreenContext";

export function WinScreen() {
  const { lastScore, level, levelUp, currentLevel, startGame } = useGame();
  const { gameConfig, refreshStats } = useWallet();
  const { identityStatus, claimStatus } = useGoodDollar();
  const { showScreen } = useScreen();

  return (
    <div className="screen active">
      <div className="result-card">
        <div className="result-hero">{levelUp ? "🎉" : "🏆"}</div>
        <h1>{levelUp ? "Level Up!" : "You Won!"}</h1>
        <div className="result-score">{lastScore} / {gameConfig.totalQuestions}</div>
        {levelUp ? (
          <p>You completed Level {level} and unlocked <strong>Level {currentLevel}</strong>!</p>
        ) : (
          <p>Great job! You passed Level {level}.</p>
        )}

        {identityStatus.status === "verified" && (
          <div className="claim-section">
            <span className="claim-label">
              {claimStatus.canClaim
                ? "Claim your daily G$ reward:"
                : claimStatus.nextClaimTime
                  ? `Next claim available ${claimStatus.nextClaimTime.toLocaleTimeString()}`
                  : "Claim your daily G$ reward:"}
            </span>
            <ClaimButton />
          </div>
        )}

        {identityStatus.status !== "verified" && (
          <p style={{ fontSize: 13, color: "var(--muted)", marginTop: 16 }}>
            Verify with GoodDollar to claim daily G$ rewards
          </p>
        )}

        <div className="result-btns">
          {levelUp && currentLevel <= 10 && (
            <Button variant="primary" onClick={() => startGame(currentLevel)}>
              🚀 Play Level {currentLevel}
            </Button>
          )}
          <Button variant={levelUp ? "secondary" : "primary"} onClick={() => startGame(level)}>
            🔄 Replay Level {level}
          </Button>
          <Button variant="secondary" onClick={() => { refreshStats(); showScreen("menu"); }}>
            Main Menu
          </Button>
        </div>
      </div>
    </div>
  );
}
