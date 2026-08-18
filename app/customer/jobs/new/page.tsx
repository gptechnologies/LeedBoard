import { UserRole } from "@prisma/client";
import { AppScreenHeader } from "@/components/marketplace/app-screen-header";
import { SimpleJobRequestForm } from "@/components/marketplace/simple-job-request-form";
import { getCustomerHomeProfiles } from "@/lib/marketplace";
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
  const homeProfiles = await getCustomerHomeProfiles(user.id);

  return (
    <div className="wk-app-screen wk-post-screen">
      <AppScreenHeader accountMenu initials={`${user.firstName.charAt(0)}${user.lastName.charAt(0)}`} />
      <div className="wk-screen-content">
        <header className="wk-homeowner-task-heading">
          <h1>What do you need cleaned?</h1>
          <p>Tell us where and when. Cleaners will send their prices.</p>
        </header>
        {params.error ? <div className="notice error">{params.error}</div> : null}
        {homeProfiles.length === 0 ? (
          <div className="notice error">
            Add a home address from the Home tab before posting a job.
          </div>
        ) : null}
        <SimpleJobRequestForm homeProfiles={homeProfiles} />
      </div>
    </div>
  );
}
