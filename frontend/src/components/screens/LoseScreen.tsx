import { Button } from "../ui/Button";
import { useGame } from "../../contexts/GameContext";
import { useWallet } from "../../contexts/WalletContext";
import { useScreen } from "../../contexts/ScreenContext";

export function LoseScreen() {
  const { lastScore, startGame } = useGame();
  const { gameConfig, refreshStats } = useWallet();
  const { showScreen } = useScreen();

  return (
    <div className="screen active">
      <div className="result-card">
        <div className="result-hero">😔</div>
        <h1>Not Quite!</h1>
        <div className="result-score">{lastScore} / {gameConfig.totalQuestions}</div>
        <p>You need at least {gameConfig.passingScore} correct to win. Try again!</p>

        <div className="result-btns">
          <Button variant="primary" onClick={startGame}>🎯 Try Again</Button>
          <Button variant="secondary" onClick={() => { refreshStats(); showScreen("menu"); }}>
            Main Menu
          </Button>
        </div>
      </div>
    </div>
  );
}
