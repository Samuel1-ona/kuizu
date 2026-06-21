import { ethers } from "ethers";
import { CHAIN_ID, RPC_URL } from "../constants/config";

const CELO_CHAIN = {
  chainId: "0x" + CHAIN_ID.toString(16),
  chainName: "Celo Mainnet",
  nativeCurrency: { name: "CELO", symbol: "CELO", decimals: 18 },
  rpcUrls: [RPC_URL],
  blockExplorerUrls: ["https://celoscan.io"],
};

export async function connectWallet() {
  if (!window.ethereum) {
    throw new Error("No wallet detected. Please install MetaMask or open Kuizu inside MiniPay.");
  }

  await window.ethereum.request({ method: "eth_requestAccounts" });
  let provider = new ethers.BrowserProvider(window.ethereum);

  const network = await provider.getNetwork();
  if (Number(network.chainId) !== CHAIN_ID) {
    try {
      await window.ethereum.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: CELO_CHAIN.chainId }],
      });
    } catch (switchErr: unknown) {
      const code = (switchErr as { code?: number }).code;
      // 4902 = chain not added to wallet yet
      if (code === 4902) {
        await window.ethereum.request({
          method: "wallet_addEthereumChain",
          params: [CELO_CHAIN],
        });
      } else {
        throw new Error("Please switch to Celo Mainnet to play Kuizu.");
      }
    }
    provider = new ethers.BrowserProvider(window.ethereum);
  }

  const signer = await provider.getSigner();
  const address = await signer.getAddress();
  return { provider, signer, address };
}

export function shortAddr(addr: string) {
  if (!addr) return "";
  return addr.slice(0, 6) + "…" + addr.slice(-4);
}
