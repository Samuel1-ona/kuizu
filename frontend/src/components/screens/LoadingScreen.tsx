import { Logo } from "../ui/Logo";
import { Spinner } from "../ui/Spinner";
import { useScreen } from "../../contexts/ScreenContext";

export function LoadingScreen() {
  const { loadingText } = useScreen();
  return (
    <div className="screen active">
      <Logo />
      <Spinner />
      <p style={{ textAlign: "center" }}>{loadingText}</p>
    </div>
  );
}
