import { redirect } from "next/navigation";
import { AuthRoleChooser } from "@/components/auth/auth-role-chooser";
import { OtpStartForm } from "@/components/auth/otp-start-form";
import { getCurrentUser, getPostAuthPath, getSafeReturnTo, getVerifyContactPath, isFullyVerified } from "@/lib/session";

type LoginPageProps = {
  searchParams: Promise<{
    error?: string;
    inviteToken?: string;
    role?: string;
    returnTo?: string;
  }>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const [params, user] = await Promise.all([searchParams, getCurrentUser()]);
  const returnTo = getSafeReturnTo(params.returnTo) ?? undefined;

  if (user) {
    if (!isFullyVerified(user)) {
      redirect(getVerifyContactPath(user, { inviteToken: params.inviteToken, returnTo }));
    }

    redirect(getPostAuthPath({ inviteToken: params.inviteToken, returnTo, role: user.role }));
  }

  const role =
    params.role === "CLEANER"
      ? "CLEANER"
      : params.role === "CUSTOMER"
        ? "CUSTOMER"
        : null;

  if (!role) {
    return <AuthRoleChooser error={params.error} returnTo={returnTo} />;
  }

  return (
    <OtpStartForm
      error={params.error}
      inviteToken={params.inviteToken}
      mode="login"
      returnTo={returnTo}
      role={role}
    />
  );
}
