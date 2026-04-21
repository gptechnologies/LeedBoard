import type { Metadata } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import "@/app/globals.css";
import { SiteHeader } from "@/components/site-header";
import { clerkAppearance } from "@/lib/clerk";

export const metadata: Metadata = {
  title: "Well Kept",
  description:
    "Well Kept is a New York home cleaning marketplace where homeowners and apartment renters post cleaning jobs, compare bids, and book professional cleaners.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider appearance={clerkAppearance}>
      <html lang="en">
        <body>
          <SiteHeader />
          <main>{children}</main>
        </body>
      </html>
    </ClerkProvider>
  );
}
