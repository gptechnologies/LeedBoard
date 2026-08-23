import Link from "next/link";
import { Bell, Settings, X } from "lucide-react";
import type { ReactNode } from "react";
import { AppAccountMenu } from "@/components/marketplace/app-account-menu";

export function AppScreenHeader({
  actionHref,
  actionLabel,
  actionType = "settings",
  accountMenu,
  centeredTitle,
  initials,
  middle,
  title,
}: {
  actionHref?: string;
  actionLabel?: string;
  actionType?: "settings" | "notifications" | "initials" | "close";
  accountMenu?: boolean;
  centeredTitle?: boolean;
  initials?: string;
  middle?: ReactNode;
  title?: string;
}) {
  if (accountMenu && initials) {
    return (
      <header className={`wk-screen-header${centeredTitle ? " wk-screen-header--centered" : ""}${middle ? " wk-screen-header--with-middle" : ""}`}>
        {centeredTitle ? (
          <>
            <span aria-hidden="true" className="wk-screen-header__spacer" />
            <h1>{title}</h1>
          </>
        ) : (
          <Link className="wk-wordmark" href="/">
            Well Kept<span aria-hidden="true">✦</span>
          </Link>
        )}
        {middle}
        <AppAccountMenu initials={initials} />
      </header>
    );
  }

  const action = (
    <span className="wk-screen-header__action" aria-label={actionLabel}>
      {actionType === "notifications" ? (
        <Bell aria-hidden="true" />
      ) : actionType === "close" ? (
        <X aria-hidden="true" />
      ) : actionType === "initials" ? (
        initials
      ) : (
        <Settings aria-hidden="true" />
      )}
    </span>
  );

  return (
    <header className={`wk-screen-header${centeredTitle ? " wk-screen-header--centered" : ""}`}>
      {centeredTitle ? (
        <>
          <span aria-hidden="true" className="wk-screen-header__spacer" />
          <h1>{title}</h1>
        </>
      ) : (
        <Link className="wk-wordmark" href="/">
          Well Kept<span aria-hidden="true">✦</span>
        </Link>
      )}
      {actionHref ? <Link href={actionHref}>{action}</Link> : action}
    </header>
  );
}
