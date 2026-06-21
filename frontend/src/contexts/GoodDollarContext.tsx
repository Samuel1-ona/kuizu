import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react";
import { useAccount, usePublicClient, useWalletClient } from "wagmi";
import { IdentitySDK, ClaimSDK } from "@goodsdks/citizen-sdk";
import type { IdentityStatus } from "../types";

interface GoodDollarContextValue {
  identitySDK: IdentitySDK | null;
  claimSDK: ClaimSDK | null;
  identityStatus: IdentityStatus;
  claimStatus: {
    canClaim: boolean;
    entitlement: bigint;
    nextClaimTime: Date | null;
  };
  fvLink: string | null;
  checkIdentity: () => Promise<void>;
  checkClaim: () => Promise<void>;
  generateFVLink: () => Promise<string | null>;
}

const GoodDollarContext = createContext<GoodDollarContextValue>(null!);

export function GoodDollarProvider({ children }: { children: ReactNode }) {
  const { address } = useAccount();
  const publicClient = usePublicClient();
  const { data: walletClient } = useWalletClient();

  const [identitySDK, setIdentitySDK] = useState<IdentitySDK | null>(null);
  const [claimSDK, setClaimSDK] = useState<ClaimSDK | null>(null);
  const [identityStatus, setIdentityStatus] = useState<IdentityStatus>({ status: "checking" });
  const [claimStatus, setClaimStatus] = useState<{ canClaim: boolean; entitlement: bigint; nextClaimTime: Date | null }>({
    canClaim: false, entitlement: 0n, nextClaimTime: null,
  });
  const [fvLink, setFvLink] = useState<string | null>(null);

  // Initialize SDKs when wallet connects
  useEffect(() => {
    if (!address || !publicClient || !walletClient) {
      setIdentitySDK(null);
      setClaimSDK(null);
      return;
    }

    try {
      const idSDK = new IdentitySDK({
        account: address,
        publicClient: publicClient as never,
        walletClient: walletClient as never,
        env: "production",
      });
      setIdentitySDK(idSDK);

      const cSDK = new ClaimSDK({
        account: address,
        publicClient: publicClient as never,
        walletClient: walletClient as never,
        identitySDK: idSDK,
        env: "production",
      });
      setClaimSDK(cSDK);
    } catch (err) {
      console.error("Failed to initialize GoodDollar SDKs:", err);
    }
  }, [address, publicClient, walletClient]);

  const checkIdentity = useCallback(async () => {
    if (!identitySDK || !address) {
      setIdentityStatus({ status: "unknown" });
      return;
    }

    try {
      const { isWhitelisted, root } = await identitySDK.getWhitelistedRoot(address);

      if (!isWhitelisted) {
        setIdentityStatus({ status: "unverified" });
        return;
      }

      const expiryData = await identitySDK.getIdentityExpiryData(address);
      const expiresAt = Number(expiryData.lastAuthenticated) + Number(expiryData.authPeriod) * 86_400;
      const now = Math.floor(Date.now() / 1000);

      if (expiresAt < now) {
        setIdentityStatus({ status: "expired" });
      } else {
        setIdentityStatus({ status: "verified", root: root || null });
      }
    } catch (err) {
      console.error("Identity check failed:", err);
      setIdentityStatus({ status: "unknown" });
    }
  }, [identitySDK, address]);

  const checkClaim = useCallback(async () => {
    if (!claimSDK) return;

    try {
      const status = await claimSDK.getWalletClaimStatus();
      setClaimStatus({
        canClaim: status.status === "can_claim",
        entitlement: status.entitlement,
        nextClaimTime: status.nextClaimTime || null,
      });
    } catch (err) {
      console.error("Claim status check failed:", err);
    }
  }, [claimSDK]);

  const generateFVLink = useCallback(async () => {
    if (!identitySDK) return null;

    try {
      const link = await identitySDK.generateFVLink(true);
      setFvLink(link);
      return link;
    } catch (err) {
      console.error("Failed to generate FV link:", err);
      return null;
    }
  }, [identitySDK]);

  // Auto-check identity when SDK initializes
  useEffect(() => {
    if (identitySDK) checkIdentity();
  }, [identitySDK, checkIdentity]);

  // Auto-check claim status when ClaimSDK initializes
  useEffect(() => {
    if (claimSDK) checkClaim();
  }, [claimSDK, checkClaim]);

  return (
    <GoodDollarContext.Provider value={{
      identitySDK, claimSDK, identityStatus, claimStatus, fvLink,
      checkIdentity, checkClaim, generateFVLink,
    }}>
      {children}
    </GoodDollarContext.Provider>
  );
}

export function useGoodDollar() {
  return useContext(GoodDollarContext);
}
