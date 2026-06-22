import { Web3AuthProvider } from "@web3auth/modal/react";
import { WagmiProvider } from "@web3auth/modal/react/wagmi";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { web3AuthConfig } from "./web3auth";
import { ScreenProvider, useScreen } from "./contexts/ScreenContext";
import { WalletProvider } from "./contexts/WalletContext";
import { GoodDollarProvider } from "./contexts/GoodDollarContext";
import { GameProvider } from "./contexts/GameContext";

import { LoadingScreen } from "./components/screens/LoadingScreen";
import { ConnectScreen } from "./components/screens/ConnectScreen";
import { MenuScreen } from "./components/screens/MenuScreen";
import { GameScreen } from "./components/screens/GameScreen";
import { WinScreen } from "./components/screens/WinScreen";
import { LoseScreen } from "./components/screens/LoseScreen";
import { LeaderboardScreen } from "./components/screens/LeaderboardScreen";
import { UsernameScreen } from "./components/screens/UsernameScreen";
import { ErrorScreen } from "./components/screens/ErrorScreen";
import { LevelSelectScreen } from "./components/screens/LevelSelectScreen";

const queryClient = new QueryClient();

function ScreenRouter() {
  const { currentScreen } = useScreen();

  switch (currentScreen) {
    case "loading":     return <LoadingScreen />;
    case "connect":     return <ConnectScreen />;
    case "menu":        return <MenuScreen />;
    case "levelselect": return <LevelSelectScreen />;
    case "game":        return <GameScreen />;
    case "win":         return <WinScreen />;
    case "lose":        return <LoseScreen />;
    case "leaderboard": return <LeaderboardScreen />;
    case "username":    return <UsernameScreen />;
    case "error":       return <ErrorScreen />;
  }
}

export default function App() {
  return (
    <Web3AuthProvider config={web3AuthConfig}>
      <QueryClientProvider client={queryClient}>
        <WagmiProvider>
          <ScreenProvider>
            <WalletProvider>
              <GoodDollarProvider>
                <GameProvider>
                  <ScreenRouter />
                </GameProvider>
              </GoodDollarProvider>
            </WalletProvider>
          </ScreenProvider>
        </WagmiProvider>
      </QueryClientProvider>
    </Web3AuthProvider>
  );
}
