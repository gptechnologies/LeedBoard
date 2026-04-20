import { UserRole } from "@prisma/client";
import { JobRequestForm } from "@/components/marketplace/job-request-form";
import { getDefaultHomeProfile } from "@/lib/marketplace";
import { requireUser } from "@/lib/session";

export const dynamic = "force-dynamic";

type CustomerNewJobPageProps = {
  searchParams: Promise<{
    error?: string;
  }>;
};

export default async function CustomerNewJobPage({
  searchParams,
}: CustomerNewJobPageProps) {
  const user = await requireUser(UserRole.CUSTOMER);
  const params = await searchParams;
  const homeProfile = await getDefaultHomeProfile(user.id);

  return (
    <div className="market-shell market-shell--detail">
      <section className="market-surface">
        <header className="market-topbar market-topbar--detail">
          <div>
            <div className="market-kicker">New cleaning request</div>
            <h1>Post a job</h1>
          </div>
        </header>

        {params.error ? <div className="notice error">{params.error}</div> : null}

        <JobRequestForm defaultHomeProfile={homeProfile} />
      </section>
    </div>
  );
}
