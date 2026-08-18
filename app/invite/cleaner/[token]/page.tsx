import { JobOutreachStatus, UserRole } from "@prisma/client";
import Link from "next/link";
import type { ReactNode } from "react";
import { notFound, redirect } from "next/navigation";
import {
  completeOutreachOnboarding,
  isOutreachExpired,
} from "@/lib/outreach";
import { prisma } from "@/lib/prisma";
import {
  getCurrentUser,
  getVerifyContactPath,
  isFullyVerified,
  needsAccountSetup,
} from "@/lib/session";
import { formatTimingSummary } from "@/lib/marketplace";
import { getCleaningJobTitle } from "@/lib/job-title";

export const dynamic = "force-dynamic";

type Params = Promise<{
  token: string;
}>;

export default async function CleanerInvitePage({ params }: { params: Params }) {
  const { token } = await params;
  const [user, outreach] = await Promise.all([
    getCurrentUser(),
    prisma.jobOutreach.findUnique({
      where: { interestToken: token },
      include: {
        cleanerLead: true,
        jobRequest: {
          include: {
            homeProfile: {
              select: {
                propertyType: true,
              },
            },
          },
        },
      },
    }),
  ]);

  if (!outreach) {
    notFound();
  }

  if (isOutreachExpired(outreach)) {
    return (
      <InviteShell eyebrow="Invite expired" title="This cleaner invite is no longer active.">
        <p className="subtle">Ask Well Kept for a fresh job link if you still want to bid.</p>
      </InviteShell>
    );
  }

  if (user) {
    if (user.role !== UserRole.CLEANER) {
      return (
        <InviteShell eyebrow="Cleaner invite" title="This invite is for a cleaner account.">
          <p className="subtle">
            Sign out and continue with the email you use for cleaner work.
          </p>
        </InviteShell>
      );
    }

    if (!isFullyVerified(user)) {
      redirect(getVerifyContactPath(user, { inviteToken: token }));
    }

    if (needsAccountSetup(user)) {
      redirect(`/welcome?role=${UserRole.CLEANER}&inviteToken=${encodeURIComponent(token)}`);
    }

    if (outreach.status !== JobOutreachStatus.BID_SUBMITTED) {
      await completeOutreachOnboarding({
        outreachId: outreach.id,
        cleanerUserId: user.id,
      });
    }

    redirect(`/cleaner/jobs/${outreach.jobRequestId}`);
  }

  const job = outreach.jobRequest;
  const cleanerName =
    outreach.cleanerLead?.businessName ?? outreach.cleanerLead?.name ?? "Cleaner";

  return (
    <InviteShell eyebrow="Cleaner invite" title="Want to bid on this job?">
      <article className="market-card">
        <div className="stack small">
          <span className="market-card__meta">{cleanerName}</span>
          <strong>{getCleaningJobTitle(job)}</strong>
          <span className="market-card__meta">
            {job.city}, {job.state} {job.postalCode}
          </span>
          <span className="market-card__meta">{formatTimingSummary(job)}</span>
          {job.notes ? <p className="market-card__copy">{job.notes}</p> : null}
        </div>
      </article>

      {outreach.status === JobOutreachStatus.NOT_INTERESTED ? (
        <div className="notice">You marked this job as not interested.</div>
      ) : (
        <div className="stack">
          <form action={`/invite/cleaner/${token}/interested`} method="post">
            <button type="submit">I am interested</button>
          </form>
          <form action={`/invite/cleaner/${token}/not-interested`} method="post">
            <button type="submit" className="secondary-submit">
              Not interested
            </button>
          </form>
          <Link
            href={`/login?role=${UserRole.CLEANER}&inviteToken=${encodeURIComponent(token)}`}
            className="button-link secondary"
          >
            Already have an account?
          </Link>
        </div>
      )}
    </InviteShell>
  );
}

function InviteShell({
  children,
  eyebrow,
  title,
}: {
  children: ReactNode;
  eyebrow: string;
  title: string;
}) {
  return (
    <section className="auth-shell stack">
      <div>
        <div className="eyebrow">{eyebrow}</div>
        <h1>{title}</h1>
      </div>
      {children}
    </section>
  );
}
