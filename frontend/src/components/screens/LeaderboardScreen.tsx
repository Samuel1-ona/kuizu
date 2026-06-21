import { useEffect, useState } from "react";
import { Button } from "../ui/Button";
import { Card } from "../ui/Card";
import { Spinner } from "../ui/Spinner";
import { useWallet } from "../../contexts/WalletContext";
import { useScreen } from "../../contexts/ScreenContext";
import { shortAddr } from "../../services/wallet";
import { LEADERBOARD_SIZE } from "../../constants/config";

interface LeaderboardRow {
  rank: number;
  display: string;
  score: string;
  isMe: boolean;
  medalClass: string;
}

export function LeaderboardScreen() {
  const { contract, address, contractDeployed, gameConfig } = useWallet();
  const { showScreen } = useScreen();
  const [rows, setRows] = useState<LeaderboardRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!contractDeployed || !contract || !address) {
      setLoading(false);
      setError(contractDeployed ? "" : "Contract not yet deployed");
      return;
    }

    (async () => {
      try {
        const [[topAddrs, topScores, topNames, callerRankBig], myStats, myName] = await Promise.all([
          contract.getLeaderboard(LEADERBOARD_SIZE),
          contract.stats(address).catch(() => null),
          contract.usernames(address).catch(() => ""),
        ]);

        const callerRank = Number(callerRankBig);
        const medals = ["gold", "silver", "bronze"];
        const result: LeaderboardRow[] = [];

        (topAddrs as string[]).forEach((addr: string, i: number) => {
          const rank = i + 1;
          const isMe = callerRank === rank;
          result.push({
            rank,
            display: (topNames as string[])[i] || shortAddr(addr),
            score: `${(topScores as bigint[])[i]}/${gameConfig.totalQuestions}`,
            isMe,
            medalClass: medals[i] || "",
          });
        });

        if (callerRank > LEADERBOARD_SIZE && myStats?.hasPlayed) {
          result.push({
            rank: -1, display: "", score: "", isMe: false, medalClass: "separator",
          });
          result.push({
            rank: callerRank,
            display: myName || "You",
            score: `${myStats.highScore}/${gameConfig.totalQuestions}`,
            isMe: true,
            medalClass: "",
          });
        }

        setRows(result);
      } catch (err) {
        console.error("Leaderboard error:", err);
        setError("Failed to load leaderboard");
      } finally {
        setLoading(false);
      }
    })();
  }, [contract, address, contractDeployed, gameConfig.totalQuestions]);

  return (
    <div className="screen active">
      <div className="lb-header">
        <Button variant="back" onClick={() => showScreen("menu")}>← Back</Button>
        <h2>🏆 Leaderboard</h2>
      </div>

      <Card>
        {loading ? (
          <Spinner />
        ) : error ? (
          <p className="lb-empty">{error}</p>
        ) : rows.length === 0 ? (
          <p className="lb-empty">No games played yet — be the first!</p>
        ) : (
          <table className="lb-table">
            <thead>
              <tr>
                <th>Rank</th>
                <th>Player</th>
                <th style={{ textAlign: "right" }}>Best</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row, i) => {
                if (row.medalClass === "separator") {
                  return (
                    <tr key={`sep-${i}`}>
                      <td colSpan={3} className="lb-separator">· · ·</td>
                    </tr>
                  );
                }
                return (
                  <tr key={i} className={row.isMe ? "my-row" : ""}>
                    <td className={`lb-rank ${row.medalClass}`}>#{row.rank}</td>
                    <td className="lb-addr">
                      {row.display}
                      {row.isMe && <span className="you-tag"> (you)</span>}
                    </td>
                    <td className="lb-score">{row.score}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </Card>
    </div>
  );
}
