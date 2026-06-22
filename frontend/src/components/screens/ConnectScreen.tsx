import { Logo } from "../ui/Logo";
import { Button } from "../ui/Button";
import { useWeb3AuthConnect } from "@web3auth/modal/react";

export function ConnectScreen() {
  const { connect, loading, error } = useWeb3AuthConnect();

  const handleConnect = async () => {
    try {
      await connect();
    } catch (err) {
      console.error("Connect error:", err);
    }
  };

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
      <Button variant="primary" onClick={handleConnect} disabled={loading}>
        {loading ? "Connecting…" : "🎯 Sign In to Play"}
      </Button>
      <p style={{ fontSize: 13, color: "var(--muted)", marginTop: 12, textAlign: "center" }}>
        Use email, Google, or MetaMask
      </p>
      {error && (
        <p style={{ fontSize: 13, color: "var(--red)", marginTop: 8, textAlign: "center" }}>
          {error.message}
        </p>
      )}
    </div>
  );
}
