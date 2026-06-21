import type { IdentityStatus } from "../../types";

const messages: Record<string, string> = {
  verified:   "✓  GoodDollar Verified — you can earn G$",
  unverified: "⚠  Not verified — verify with GoodDollar to earn G$",
  expired:    "⚠  Verification expired — please re-verify to earn G$",
  unknown:    "?  Could not check identity",
  checking:   "…  Checking identity…",
};

export function IdentityBanner({ status }: { status: IdentityStatus }) {
  return (
    <div className={`identity-banner ${status.status}`}>
      {messages[status.status] || messages.checking}
    </div>
  );
}
