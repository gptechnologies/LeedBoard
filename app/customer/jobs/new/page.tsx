import { UserRole } from "@prisma/client";
import { X } from "lucide-react";
import Link from "next/link";
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
      <Link aria-label="Close new job" className="wk-post-close wk-screen-header__action" href="/customer">
        <X aria-hidden="true" />
      </Link>
      <div className="wk-screen-content">
        {params.error ? <div className="notice error">{params.error}</div> : null}
        <SimpleJobRequestForm homeProfiles={homeProfiles} />
      </div>
    </div>
  );
}
