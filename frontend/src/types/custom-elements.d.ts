declare namespace JSX {
  interface IntrinsicElements {
    "claim-button": React.DetailedHTMLProps<
      React.HTMLAttributes<HTMLElement> & {
        environment?: string;
        "chain-id"?: string;
      },
      HTMLElement
    >;
  }
}
