import type { Metadata } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import "@/app/globals.css";
import { SiteHeader } from "@/components/site-header";
import { clerkAppearance } from "@/lib/clerk";

export const metadata: Metadata = {
  title: "Archmont Cleaners",
  description: "Premium home cleaning with trusted professionals, transparent pricing, and seamless booking.",
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
