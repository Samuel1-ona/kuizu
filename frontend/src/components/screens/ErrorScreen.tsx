import { Button } from "../ui/Button";
import { useScreen } from "../../contexts/ScreenContext";

export function ErrorScreen() {
  const { errorMessage, showScreen } = useScreen();

  return (
    <div className="screen active">
      <div className="error-icon">⚠️</div>
      <h2>Something went wrong</h2>
      <p style={{ textAlign: "center", margin: "12px 0 24px", maxWidth: "var(--max-w)" }}>
        {errorMessage}
      </p>
      <Button variant="secondary" onClick={() => showScreen("menu")}>Go Back</Button>
    </div>
  );
}
