import { NextResponse } from "next/server";

import {
  expirePastOpenJobs,
  markUnansweredJobsForAttention,
  processPendingOutreachJobs,
} from "@/lib/outreach-worker";
import { retryPendingMarketplaceEmails } from "@/lib/marketplace-notifications";

function isAuthorized(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret) return process.env.NODE_ENV !== "production";
  return request.headers.get("authorization") === `Bearer ${secret}`;
}

export async function GET(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const expiredCount = await expirePastOpenJobs();
  const [processed, attentionCount, emailRetryCount] = await Promise.all([
    processPendingOutreachJobs(),
    markUnansweredJobsForAttention(),
    retryPendingMarketplaceEmails(),
  ]);

  return NextResponse.json({
    attentionCount,
    expiredCount,
    emailRetryCount,
    processedCount: processed.length,
  });
}
