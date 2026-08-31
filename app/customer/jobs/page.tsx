import { JobRequestStatus, UserRole } from "@prisma/client";
import { AppScreenHeader } from "@/components/marketplace/app-screen-header";
import { HomeownerJobsWorkspace } from "@/components/marketplace/homeowner-jobs-workspace";
import { getCustomerHomeData } from "@/lib/marketplace";
import { requireUser } from "@/lib/session";

export const dynamic = "force-dynamic";

export default async function CustomerJobsPage() {
  const user = await requireUser(UserRole.CUSTOMER);
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
        <HomeownerJobsWorkspace jobs={activeJobs} />
      </div>
    </div>
  );
}
