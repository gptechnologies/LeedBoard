import { SignIn } from "@clerk/nextjs";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { getCurrentUser, getRoleHome } from "@/lib/session";

export default async function LoginPage() {
  const [{ userId }, user] = await Promise.all([auth(), getCurrentUser()]);

  if (user) {
    redirect(getRoleHome(user.role));
  }

  if (userId) {
    redirect("/welcome");
  }

  return (
    <section className="auth-shell stack">
      <div>
        <div className="eyebrow">Welcome back</div>
        <h1>Sign in to your WellKept account.</h1>
        <p className="subtle">
          Access your jobs, bids, schedules, and account details in one place.
        </p>
      </div>
      <SignIn
        path="/login"
        routing="path"
        signUpUrl="/signup"
        forceRedirectUrl="/auth/continue"
      />
    </section>
  );
}
