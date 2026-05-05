import { MobileNav } from "@/components/marketplace/mobile-nav";

export default function CustomerLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      <MobileNav role="customer" />
    </>
  );
}
