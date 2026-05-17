import { redirect } from "next/navigation";
import { OtpStartForm } from "@/components/auth/otp-start-form";
import { getCurrentUser, getRoleHome } from "@/lib/session";

type LoginPageProps = {
  searchParams: Promise<{
    error?: string;
    inviteToken?: string;
    role?: string;
  }>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const [params, user] = await Promise.all([searchParams, getCurrentUser()]);

  if (user && params.inviteToken) {
    redirect(`/invite/cleaner/${params.inviteToken}`);
  }

  if (user) {
    redirect(getRoleHome(user.role));
  }

  const role = params.role === "CLEANER" ? "CLEANER" : "CUSTOMER";

  return (
    <OtpStartForm
      error={params.error}
      inviteToken={params.inviteToken}
      mode="login"
      role={role}
    />
  );
}
