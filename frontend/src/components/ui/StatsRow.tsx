import type { PlayerStats } from "../../types";

interface StatsRowProps {
  stats: PlayerStats | null;
  totalQuestions: number;
}

export function StatsRow({ stats, totalQuestions }: StatsRowProps) {
  return (
    <div className="stats-row">
      <div className="stat-box">
        <div className="stat-value">{stats ? `${stats.highScore}/${totalQuestions}` : "-"}</div>
        <div className="stat-label">Best Score</div>
      </div>
      <div className="stat-box">
        <div className="stat-value">{stats?.gamesPlayed ?? "-"}</div>
        <div className="stat-label">Games Played</div>
      </div>
      <div className="stat-box">
        <div className="stat-value">{stats?.gamesWon ?? "-"}</div>
        <div className="stat-label">Games Won</div>
      </div>
    </div>
  );
}
