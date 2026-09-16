import { UserRole } from "@prisma/client";
import { redirect } from "next/navigation";
import { OtpStartForm } from "@/components/auth/otp-start-form";
import Link from "next/link";
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

  if (selectedRole === UserRole.CLEANER && !params.inviteToken) {
    return (
      <section className="auth-shell auth-passcode-card">
        <div className="auth-intro">
          <span className="eyebrow">Cleaner access</span>
          <h1>Cleaner accounts are invite-only.</h1>
          <p>We are onboarding providers carefully while Well Kept launches. If you received an invite, use the link in that email.</p>
        </div>
        <Link className="auth-send-button" href="/login">Sign in to an existing account</Link>
        <Link className="auth-switch-role" href="/signup?role=CUSTOMER">Create a homeowner account</Link>
      </section>
    );
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
