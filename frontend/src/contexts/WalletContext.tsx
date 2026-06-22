import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from "react";
import { ethers, type BrowserProvider, type JsonRpcSigner, type Contract } from "ethers";
import { useAccount, useWalletClient } from "wagmi";
import { useWeb3AuthConnect } from "@web3auth/modal/react";
import { shortAddr } from "../services/wallet";
import { KUIZU_ADDRESS, KUIZU_ABI, QUESTIONS_PER_GAME, PASSING_SCORE } from "../constants/config";
import { useScreen } from "./ScreenContext";
import type { PlayerStats, GameConfig } from "../types";

const CONTRACT_DEPLOYED = KUIZU_ADDRESS !== "0x0000000000000000000000000000000000000000";

interface WalletContextValue {
  provider: BrowserProvider | null;
  signer: JsonRpcSigner | null;
  address: string | null;
  shortAddress: string;
  contract: Contract | null;
  gameConfig: GameConfig;
  stats: PlayerStats | null;
  username: string;
  contractDeployed: boolean;
  connect: () => Promise<void>;
  refreshStats: () => Promise<void>;
  submitUsername: (name: string) => Promise<void>;
}

const WalletContext = createContext<WalletContextValue>(null!);

export function WalletProvider({ children }: { children: ReactNode }) {
  const { showScreen, showLoading } = useScreen();
  const { address: wagmiAddress, isConnected } = useAccount();
  const { data: walletClient } = useWalletClient();
  const { connect: web3AuthConnect } = useWeb3AuthConnect();

  const [provider, setProvider] = useState<BrowserProvider | null>(null);
  const [signer, setSigner] = useState<JsonRpcSigner | null>(null);
  const [address, setAddress] = useState<string | null>(null);
  const [shortAddress, setShortAddress] = useState("");
  const [contract, setContract] = useState<Contract | null>(null);
  const [gameConfig, setGameConfig] = useState<GameConfig>({ totalQuestions: QUESTIONS_PER_GAME, passingScore: PASSING_SCORE });
  const [stats, setStats] = useState<PlayerStats | null>(null);
  const [username, setUsername] = useState("");
  const [initialized, setInitialized] = useState(false);

  const refreshStats = useCallback(async () => {
    if (!contract || !address) return;
    try {
      const [s, name] = await Promise.all([
        contract.stats(address),
        contract.usernames(address).catch(() => ""),
      ]);
      setStats({
        gamesPlayed: Number(s.gamesPlayed),
        gamesWon: Number(s.gamesWon),
        lastPlayedAt: Number(s.lastPlayedAt),
        highScore: Number(s.highScore),
        hasPlayed: s.hasPlayed,
      });
      setUsername(name || "");
    } catch (err) {
      console.error("Failed to load stats:", err);
    }
  }, [contract, address]);

  useEffect(() => {
    if (!isConnected || !walletClient || !wagmiAddress) return;
    if (initialized) return;

    (async () => {
      try {
        showLoading("Loading…");
        const ethersProvider = new ethers.BrowserProvider(walletClient.transport, {
          chainId: walletClient.chain.id,
          name: walletClient.chain.name,
        });
        const ethersSigner = await ethersProvider.getSigner();

        setProvider(ethersProvider);
        setSigner(ethersSigner);
        setAddress(wagmiAddress);
        setShortAddress(shortAddr(wagmiAddress));

        let kuizu: Contract | null = null;
        if (CONTRACT_DEPLOYED) {
          kuizu = new ethers.Contract(KUIZU_ADDRESS, KUIZU_ABI, ethersSigner);
          setContract(kuizu);
        }

        const tasks: Promise<unknown>[] = [];
        if (kuizu) {
          tasks.push(
            Promise.all([kuizu.totalQuestions(), kuizu.passingScore()]).then(([tq, ps]) => {
              setGameConfig({ totalQuestions: Number(tq), passingScore: Number(ps) });
            }).catch(() => {}),
          );
          tasks.push(
            Promise.all([kuizu.stats(wagmiAddress), kuizu.usernames(wagmiAddress).catch(() => "")]).then(([s, name]) => {
              setStats({
                gamesPlayed: Number(s.gamesPlayed),
                gamesWon: Number(s.gamesWon),
                lastPlayedAt: Number(s.lastPlayedAt),
                highScore: Number(s.highScore),
                hasPlayed: s.hasPlayed,
              });
              setUsername(name || "");
            }).catch(() => {}),
          );
        }

        await Promise.all(tasks);
        setInitialized(true);
        showScreen("menu");
      } catch (err) {
        console.error("Wallet setup failed:", err);
      }
    })();
  }, [isConnected, walletClient, wagmiAddress, initialized, showLoading, showScreen]);

  const connect = useCallback(async () => {
    try {
      await web3AuthConnect();
    } catch (err) {
      console.error("Web3Auth connect failed:", err);
    }
  }, [web3AuthConnect]);

  const submitUsernameAction = useCallback(async (name: string) => {
    if (!contract) throw new Error("Contract not deployed");
    showLoading("Confirm in wallet…");
    const tx = await contract.setUsername(name);
    showLoading("Saving on-chain…");
    await tx.wait();
    await refreshStats();
    showScreen("menu");
  }, [contract, refreshStats, showLoading, showScreen]);

  return (
    <WalletContext.Provider value={{
      provider, signer, address, shortAddress, contract,
      gameConfig, stats, username,
      contractDeployed: CONTRACT_DEPLOYED,
      connect, refreshStats, submitUsername: submitUsernameAction,
    }}>
      {children}
    </WalletContext.Provider>
  );
}

export function useWallet() {
  return useContext(WalletContext);
}
