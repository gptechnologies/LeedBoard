import { JobRequestStatus, UserRole } from "@prisma/client";
import { X } from "lucide-react";
import Link from "next/link";
import { AppNavigationMenu } from "@/components/marketplace/app-navigation-menu";
import { SimpleJobRequestForm } from "@/components/marketplace/simple-job-request-form";
import { getCustomerHomeProfiles } from "@/lib/marketplace";
import { requireUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

type CustomerNewJobPageProps = {
  searchParams: Promise<{
    error?: string;
    repost?: string;
  }>;
};

export default async function CustomerNewJobPage({
  searchParams,
}: CustomerNewJobPageProps) {
  const user = await requireUser(UserRole.CUSTOMER);
  const params = await searchParams;
  const homeProfiles = await getCustomerHomeProfiles(user.id);
  const repostSource = params.repost ? await prisma.jobRequest.findFirst({ where: { id: params.repost, customerId: user.id, status: JobRequestStatus.EXPIRED } }) : null;

  return (
    <div className="wk-app-screen wk-post-screen">
      <div className="wk-post-topbar">
        <Link aria-label="Close new job" className="wk-post-close wk-screen-header__action" href="/customer">
          <X aria-hidden="true" />
        </Link>
        <AppNavigationMenu />
      </div>
      <div className="wk-screen-content">
        {params.error ? <div className="notice error">{params.error}</div> : null}
        <SimpleJobRequestForm homeProfiles={homeProfiles} repostSource={repostSource} />
      </div>
    </div>
  );
}
