import { JobRequestStatus, UserRole } from "@prisma/client";

import { AppScreenHeader } from "@/components/marketplace/app-screen-header";
import { HomeownerJobsWorkspace } from "@/components/marketplace/homeowner-jobs-workspace";
import { getCustomerHomeData } from "@/lib/marketplace";
import { requireUser } from "@/lib/session";

export const dynamic = "force-dynamic";

export default async function CustomerDashboard() {
  const user = await requireUser(UserRole.CUSTOMER);
  const { jobs } = await getCustomerHomeData(user.id);
  const activeJobs = jobs.filter(
    (job) => job.status === JobRequestStatus.OPEN || job.status === JobRequestStatus.AWARDED,
  );

  return (
    <div className="wk-app-screen wk-homeowner-hub-screen">
      <AppScreenHeader brandHref="/customer" />
      <div className="wk-screen-content wk-homeowner-hub">
        <HomeownerJobsWorkspace homeownerPhone={user.phone} jobs={activeJobs} />
      </div>
    </div>
  );
}
