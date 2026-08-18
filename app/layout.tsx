import type { Metadata, Viewport } from "next";
import "@/app/globals.css";
import { SiteHeader } from "@/components/site-header";

export const metadata: Metadata = {
  title: "Well Kept",
  description:
    "Well Kept is a New York home cleaning marketplace where homeowners and apartment renters post cleaning jobs, compare bids, and book professional cleaners.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" data-scroll-behavior="smooth">
      <body>
        <a href="#main-content" className="skip-link">
          Skip to content
        </a>
        <SiteHeader />
        <main id="main-content">{children}</main>
      </body>
    </html>
  );
}
