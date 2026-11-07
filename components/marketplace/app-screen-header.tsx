import Link from "next/link";
import { AppNavigationMenu } from "@/components/marketplace/app-navigation-menu";
import { BrandDotBackground } from "./brand-dot-background";

export function AppScreenHeader({
  brandHref = "/",
  tagline = "Keep your place well kept",
}: {
  brandHref?: string;
  tagline?: string;
}) {
  return (
    <header className="wk-screen-header">
      <BrandDotBackground />
      <div className="wk-screen-brand">
        <Link className="wk-wordmark" href={brandHref}>
          Well Kept<span aria-hidden="true">✦</span>
        </Link>
        {tagline ? <p>{tagline}</p> : null}
      </div>
      <AppNavigationMenu />
    </header>
  );
}
