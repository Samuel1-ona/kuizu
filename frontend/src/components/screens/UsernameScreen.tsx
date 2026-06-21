import { useState } from "react";
import { Button } from "../ui/Button";
import { Card } from "../ui/Card";
import { useWallet } from "../../contexts/WalletContext";
import { useScreen } from "../../contexts/ScreenContext";

export function UsernameScreen() {
  const { username, submitUsername } = useWallet();
  const { showScreen } = useScreen();
  const [name, setName] = useState(username);
  const [error, setError] = useState("");

  const handleSubmit = async () => {
    const trimmed = name.trim();
    if (!trimmed) {
      setError("Please enter a username.");
      return;
    }

    try {
      await submitUsername(trimmed);
    } catch (err: unknown) {
      const code = (err as { code?: number | string })?.code;
      if (code === 4001 || code === "ACTION_REJECTED") {
        showScreen("username");
        return;
      }

      const raw = (err as { data?: string })?.data ?? (err as { error?: { data?: string } })?.error?.data;
      let errMsg = "Failed to save. Please try again.";
      if (raw && typeof raw === "string") {
        if (raw.includes("UsernameTaken")) errMsg = "That username is already taken.";
        if (raw.includes("InvalidUsername")) errMsg = "Must be 1–20 characters.";
      }
      setError(errMsg);
      showScreen("username");
    }
  };

  return (
    <div className="screen active">
      <div className="lb-header">
        <Button variant="back" onClick={() => showScreen("menu")}>← Back</Button>
        <h2>✏️ Username</h2>
      </div>

      <Card>
        <p className="mb-16">Choose a display name for the leaderboard. It must be unique and 1–20 characters.</p>

        <div className="input-group">
          <input
            className="text-input"
            type="text"
            maxLength={20}
            placeholder="Enter username"
            value={name}
            onChange={e => { setName(e.target.value); setError(""); }}
          />
          <span className="input-hint">{name.length} / 20</span>
        </div>

        <p className="input-rules">Letters, numbers, spaces, and common punctuation.</p>
        <div className="input-error">{error}</div>

        <Button variant="primary" className="mt-16" onClick={handleSubmit}>
          Save Username
        </Button>
      </Card>
    </div>
  );
}
