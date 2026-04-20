import { SignUp } from "@clerk/nextjs";
import { auth } from "@clerk/nextjs/server";
import { UserRole } from "@prisma/client";
import { redirect } from "next/navigation";
import { getCurrentUser, getRoleHome } from "@/lib/session";

type SignupPageProps = {
  searchParams: Promise<{
    role?: string;
  }>;
};

export default async function SignupPage({ searchParams }: SignupPageProps) {
  const params = await searchParams;
  const selectedRole =
    params.role === UserRole.CLEANER ? UserRole.CLEANER : UserRole.CUSTOMER;
  const [{ userId }, user] = await Promise.all([auth(), getCurrentUser()]);

  if (user) {
    redirect(getRoleHome(user.role));
  }

  if (userId) {
    redirect(`/welcome?role=${selectedRole}`);
  }

  return (
    <section className="auth-shell stack">
      <div>
        <div className="eyebrow">Get started</div>
        <h1>Create your WellKept account.</h1>
        <p className="subtle">
          Homeowners can post jobs and compare bids. Cleaners can review work, submit
          offers, and manage active jobs.
        </p>
      </div>
      <SignUp
        path="/signup"
        routing="path"
        signInUrl="/login"
        forceRedirectUrl={`/auth/continue?role=${selectedRole}`}
      />
    </section>
  );
}
