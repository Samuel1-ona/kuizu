export function Logo({ size }: { size?: "large" | "small" }) {
  const style = size === "small" ? { fontSize: "38px" } : undefined;
  return <div className="logo" style={style}>KUIZU</div>;
}
