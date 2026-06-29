import type { DetailedHTMLProps, HTMLAttributes } from "react";

declare module "react" {
  namespace JSX {
    interface IntrinsicElements {
      "claim-button": DetailedHTMLProps<HTMLAttributes<HTMLElement>, HTMLElement> & {
        environment?: string;
        "chain-id"?: string;
      };
    }
  }
}
