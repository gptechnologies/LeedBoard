import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { LandingRoleSelector } from "@/components/landing-role-selector";
import { getCurrentUser, getRoleHome } from "@/lib/session";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "New York Home Cleaning Marketplace | Well Kept",
  description:
    "Well Kept connects New York homeowners and apartment renters with professional cleaners who bid on local cleaning jobs.",
  keywords: [
    "New York home cleaning",
    "NYC apartment cleaning",
    "home cleaners New York",
    "cleaning marketplace",
    "cleaner bids",
    "professional cleaners NYC",
  ],
};

export default async function HomePage() {
  const user = await getCurrentUser();

  if (user) {
    redirect(getRoleHome(user.role));
  }

  return (
    <div className="landing-page">
      <h1 className="sr-only">Well Kept home cleaning marketplace</h1>
      <div className="landing-page__content">
        <div className="landing-wordmark" aria-label="Well Kept — Keep your place well">
          <span>Well Kept<i aria-hidden="true">✦</i></span>
          <small>Keep your place well</small>
        </div>
        <LandingRoleSelector />
      </div>
    </div>
  );
}
