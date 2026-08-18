import { UserRole } from "@prisma/client";
import { redirect } from "next/navigation";
import { OtpStartForm } from "@/components/auth/otp-start-form";
import { getCurrentUser, getPostAuthPath, getSafeReturnTo, getVerifyContactPath, isFullyVerified } from "@/lib/session";

type SignupPageProps = {
  searchParams: Promise<{
    error?: string;
    inviteToken?: string;
    role?: string;
    returnTo?: string;
  }>;
};

export default async function SignupPage({ searchParams }: SignupPageProps) {
  const [params, user] = await Promise.all([searchParams, getCurrentUser()]);
  const returnTo = getSafeReturnTo(params.returnTo) ?? undefined;
  const selectedRole =
    params.role === UserRole.CLEANER ? UserRole.CLEANER : UserRole.CUSTOMER;

  if (user) {
    if (!isFullyVerified(user)) {
      redirect(getVerifyContactPath(user, { inviteToken: params.inviteToken, returnTo }));
    }

    redirect(getPostAuthPath({ inviteToken: params.inviteToken, returnTo, role: user.role }));
  }

  return (
    <OtpStartForm
      error={params.error}
      inviteToken={params.inviteToken}
      mode="signup"
      returnTo={returnTo}
      role={selectedRole}
    />
  );
}
