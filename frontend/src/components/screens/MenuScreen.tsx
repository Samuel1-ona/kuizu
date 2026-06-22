import { Logo } from "../ui/Logo";
import { Button } from "../ui/Button";
import { IdentityBanner } from "../ui/IdentityBanner";
import { StatsRow } from "../ui/StatsRow";
import { useWallet } from "../../contexts/WalletContext";
import { useGoodDollar } from "../../contexts/GoodDollarContext";
import { useGame } from "../../contexts/GameContext";
import { useScreen } from "../../contexts/ScreenContext";

export function MenuScreen() {
  const { shortAddress, gameConfig, stats, username } = useWallet();
  const { identityStatus, generateFVLink } = useGoodDollar();
  const { currentLevel } = useGame();
  const { showScreen } = useScreen();

  const handleVerify = async () => {
    const link = await generateFVLink();
    if (link) {
      window.open(link, "_blank");
    } else {
      window.open("https://wallet.gooddollar.org", "_blank");
    }
  };

  return (
    <div className="screen active">
      <IdentityBanner status={identityStatus} />

      <div className="menu-header">
        <Logo size="small" />
        <div className="wallet-chip">
          <span>{shortAddress}</span>
        </div>
        <div className="username-row" style={{ marginTop: 8 }}>
          <span className={`username-display ${username ? "has-name" : ""}`}>
            {username || "Set a username"}
          </span>
          <button className="btn-edit-name" onClick={() => showScreen("username")}>✏️</button>
        </div>
      </div>

      <StatsRow stats={stats} totalQuestions={gameConfig.totalQuestions} />

      <div className="menu-btns">
        <Button variant="primary" onClick={() => showScreen("levelselect")}>
          🎯 Play Quiz — Level {currentLevel}
        </Button>
        <Button variant="secondary" onClick={() => showScreen("leaderboard")}>🏆 Leaderboard</Button>
        {identityStatus.status !== "verified" && (
          <Button variant="teal" onClick={handleVerify}>
            ✓ Verify with GoodDollar
          </Button>
        )}
      </div>
    </div>
  );
}
