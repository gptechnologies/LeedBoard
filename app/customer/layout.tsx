import { UserRole } from "@prisma/client";
import { redirect } from "next/navigation";
import { MobileNav } from "@/components/marketplace/mobile-nav";
import { requireUser } from "@/lib/session";

export default async function CustomerLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser(UserRole.CUSTOMER);

  if (!user.homeownerOnboardingCompletedAt) {
    redirect("/onboarding/homeowner");
  }

  return (
    <>
      {children}
      <MobileNav role="customer" />
    </>
  );
}
