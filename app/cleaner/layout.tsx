import { MobileNav } from "@/components/marketplace/mobile-nav";

export default function CleanerLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      <MobileNav role="cleaner" />
    </>
  );
}
