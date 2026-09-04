import { JobRequestStatus, UserRole } from "@prisma/client";
import { AppScreenHeader } from "@/components/marketplace/app-screen-header";
import { HomeownerJobsWorkspace } from "@/components/marketplace/homeowner-jobs-workspace";
import { getCustomerHomeData } from "@/lib/marketplace";
import { requireUser } from "@/lib/session";

export const dynamic = "force-dynamic";

type SearchParams = Promise<{ cancelled?: string }>;

export default async function CustomerJobsPage({ searchParams }: { searchParams: SearchParams }) {
  const user = await requireUser(UserRole.CUSTOMER);
  const query = await searchParams;
  const { jobs } = await getCustomerHomeData(user.id);
  const activeJobs = jobs.filter(
    (job) => job.status === JobRequestStatus.OPEN || job.status === JobRequestStatus.AWARDED,
  );
  const initials = `${user.firstName.charAt(0)}${user.lastName.charAt(0)}`.toUpperCase();

  return (
    <div className="wk-app-screen wk-homeowner-jobs-screen">
      <AppScreenHeader
        accountMenu
        initials={initials}
      />
      <div className="wk-screen-content">
        {query.cancelled === "1" ? (
          <div className="notice success" role="status">Job cancelled. Cleaners can no longer send offers.</div>
        ) : null}
        <HomeownerJobsWorkspace jobs={activeJobs} />
      </div>
    </div>
  );
}
