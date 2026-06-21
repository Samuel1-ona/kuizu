import { useRef, useEffect } from "react";
import "@goodsdks/ui-components";

export function ClaimButton({ environment = "production" }: { environment?: string }) {
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    el.setAttribute("environment", environment);

    customElements.whenDefined("claim-button").then(() => {
      if (!ref.current) return;
      (ref.current as unknown as { appkitConfig: object }).appkitConfig = {
        projectId: import.meta.env.VITE_WALLETCONNECT_PROJECT_ID || "",
        metadata: {
          name: "Kuizu",
          description: "Web3 Trivia Game on Celo",
          url: window.location.origin,
          icons: [],
        },
      };
    });
  }, [environment]);

  return <claim-button ref={ref} />;
}
