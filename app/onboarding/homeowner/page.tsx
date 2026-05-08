import { auth } from "@clerk/nextjs/server";
import { UserRole } from "@prisma/client";
import { redirect } from "next/navigation";
import { HomeownerOnboardingFlow } from "@/components/onboarding/homeowner-onboarding-flow";
import { getCurrentUser, getRoleHome } from "@/lib/session";

export const dynamic = "force-dynamic";

type HomeownerOnboardingPageProps = {
  searchParams: Promise<{
    error?: string;
  }>;
};

export default async function HomeownerOnboardingPage({
  searchParams,
}: HomeownerOnboardingPageProps) {
  const params = await searchParams;
  const [{ userId }, user] = await Promise.all([auth(), getCurrentUser()]);

  if (!userId) {
    redirect("/login");
  }

  if (!user) {
    redirect("/welcome?role=CUSTOMER");
  }

  if (user.role !== UserRole.CUSTOMER) {
    redirect(getRoleHome(user.role));
  }

  if (user.homeownerOnboardingCompletedAt) {
    redirect("/customer");
  }

  return (
    <HomeownerOnboardingFlow
      error={params.error}
      firstName={user.firstName}
      initialHeardAboutUs={user.heardAboutUs ?? ""}
      initialPushEnabled={user.pushNotificationsEnabled}
    />
  );
}
