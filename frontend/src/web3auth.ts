import { WEB3AUTH_NETWORK } from "@web3auth/modal";
import type { Web3AuthContextConfig } from "@web3auth/modal/react";

const clientId = import.meta.env.VITE_WEB3AUTH_CLIENT_ID || "";

export const web3AuthConfig: Web3AuthContextConfig = {
  web3AuthOptions: {
    clientId,
    web3AuthNetwork: WEB3AUTH_NETWORK.SAPPHIRE_DEVNET,
    chains: [
      {
        chainNamespace: "eip155",
        chainId: "0xa4ec",
        displayName: "Celo Mainnet",
        tickerName: "CELO",
        ticker: "CELO",
        decimals: 18,
        rpcTarget: import.meta.env.VITE_RPC_URL || "https://forno.celo.org",
        blockExplorerUrl: "https://celoscan.io",
      },
    ],
    defaultChainId: "0xa4ec",
    uiConfig: {
      appName: "Kuizu",
      defaultLanguage: "en",
      mode: "dark",
      primaryColor: "#7b2fbe",
    },
  },
};
