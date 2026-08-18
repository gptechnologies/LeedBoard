import Link from "next/link";
import { BriefcaseBusiness, ChevronRight, Home } from "lucide-react";

export function AuthRoleChooser({ error, returnTo }: { error?: string; returnTo?: string }) {
  const suffix = returnTo ? `&returnTo=${encodeURIComponent(returnTo)}` : "";
  return (
    <section className="auth-shell auth-passcode-card auth-role-card">
      <div className="auth-intro">
        <h1>How are you signing in?</h1>
        <p>Choose the account you want to use.</p>
      </div>

      {error ? <div className="notice error">{error}</div> : null}

      <div className="auth-role-options" aria-label="Choose account type">
        <Link href={`/login?role=CUSTOMER${suffix}`}>
          <span className="auth-role-options__icon"><Home aria-hidden="true" /></span>
          <span>
            <strong>Homeowner</strong>
            <small>Post jobs and compare cleaner bids</small>
          </span>
          <ChevronRight aria-hidden="true" />
        </Link>
        <Link href={`/login?role=CLEANER${suffix}`}>
          <span className="auth-role-options__icon"><BriefcaseBusiness aria-hidden="true" /></span>
          <span>
            <strong>Cleaner or business</strong>
            <small>Find nearby jobs and submit bids</small>
          </span>
          <ChevronRight aria-hidden="true" />
        </Link>
      </div>
    </section>
  );
}
