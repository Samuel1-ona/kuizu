import { Logo } from "../ui/Logo";
import { Button } from "../ui/Button";
import { useWallet } from "../../contexts/WalletContext";

export function ConnectScreen() {
  const { connect } = useWallet();

  return (
    <div className="screen active">
      <div className="connect-hero">
        <Logo />
        <p className="connect-tagline">Test your knowledge. Earn rewards.</p>
        <div className="connect-badges">
          <span className="badge">⛓ Celo</span>
          <span className="badge">💸 GoodDollar UBI</span>
          <span className="badge">📱 MiniPay</span>
        </div>
      </div>
      <Button variant="primary" onClick={connect}>🎯 Sign In to Play</Button>
      <p style={{ fontSize: 13, color: "var(--muted)", marginTop: 12, textAlign: "center" }}>
        Use email, Google, or MetaMask
      </p>
    </div>
  );
}
