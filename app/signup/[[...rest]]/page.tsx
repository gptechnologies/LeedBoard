import { UserRole } from "@prisma/client";
import { redirect } from "next/navigation";
import { OtpStartForm } from "@/components/auth/otp-start-form";
import { getCurrentUser, getRoleHome } from "@/lib/session";

type SignupPageProps = {
  searchParams: Promise<{
    error?: string;
    inviteToken?: string;
    role?: string;
  }>;
};

export default async function SignupPage({ searchParams }: SignupPageProps) {
  const [params, user] = await Promise.all([searchParams, getCurrentUser()]);
  const selectedRole =
    params.role === UserRole.CLEANER ? UserRole.CLEANER : UserRole.CUSTOMER;

  if (user && params.inviteToken) {
    redirect(`/invite/cleaner/${params.inviteToken}`);
  }

  if (user) {
    redirect(getRoleHome(user.role));
  }

  return (
    <OtpStartForm
      error={params.error}
      inviteToken={params.inviteToken}
      mode="signup"
      role={selectedRole}
    />
  );
}
