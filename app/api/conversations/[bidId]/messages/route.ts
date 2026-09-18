import { UserRole } from "@prisma/client";
import { NextResponse } from "next/server";

import { sendAppMessage, toThreadMessage } from "@/lib/conversation";
import { prisma } from "@/lib/prisma";
import { requireApiUser } from "@/lib/session";
import { expireJobIfDue } from "@/lib/job-lifecycle";
import { BidStatus, JobRequestStatus } from "@prisma/client";

type Params = Promise<{ bidId: string }>;

export async function GET(request: Request, { params }: { params: Params }) {
  const role = new URL(request.url).searchParams.get("role") === "cleaner" ? UserRole.CLEANER : UserRole.CUSTOMER;
  const user = await requireApiUser(request, role);
  if (user instanceof NextResponse) return user;
  const { bidId } = await params;
  const owned = await prisma.jobBid.findFirst({ where: role === UserRole.CUSTOMER ? { id: bidId, jobRequest: { customerId: user.id } } : { id: bidId, OR: [{ cleanerId: user.id }, { cleanerLead: { linkedCleanerUserId: user.id } }] }, select: { jobRequestId: true } });
  if (!owned) return NextResponse.json({ error: "Conversation not found." }, { status: 404 });
  await expireJobIfDue(owned.jobRequestId);
  const bid = await prisma.jobBid.findFirst({
    where: role === UserRole.CUSTOMER ? { id: bidId, jobRequest: { customerId: user.id } } : { id: bidId, OR: [{ cleanerId: user.id }, { cleanerLead: { linkedCleanerUserId: user.id } }] },
    select: { id: true, status: true, jobRequest: { select: { acceptedAt: true, acceptedBidId: true, status: true } } },
  });
  if (!bid) return NextResponse.json({ error: "Conversation not found." }, { status: 404 });
  const messages = await prisma.conversationMessage.findMany({ where: { bidId }, orderBy: [{ createdAt: "asc" }, { id: "asc" }] });
  const closedReason = bid.jobRequest.status === JobRequestStatus.EXPIRED ? "This job has ended" : bid.jobRequest.status === JobRequestStatus.DELETED ? "This job was removed" : bid.jobRequest.status === JobRequestStatus.CANCELLED ? "This job was cancelled" : bid.status === BidStatus.DECLINED || bid.status === BidStatus.WITHDRAWN ? "This conversation is closed" : null;
  return NextResponse.json({ messages: messages.map(toThreadMessage), chosenAt: bid.jobRequest.acceptedBidId === bidId ? bid.jobRequest.acceptedAt?.toISOString() ?? null : null, closedReason });
}

export async function POST(request: Request, { params }: { params: Params }) {
  const payload = await request.json().catch(() => null) as { role?: string; body?: string } | null;
  if (payload?.role !== "cleaner" && payload?.role !== "customer") {
    return NextResponse.json({ error: "Invalid sender." }, { status: 400 });
  }
  const role = payload.role === "cleaner" ? UserRole.CLEANER : UserRole.CUSTOMER;
  const user = await requireApiUser(request, role);
  if (user instanceof NextResponse) return user;
  const body = payload.body?.trim();
  if (!body || body.length > 2000) return NextResponse.json({ error: "Write a message of up to 2,000 characters." }, { status: 400 });
  const { bidId } = await params;
  const result = await sendAppMessage({ bidId, body, role, userId: user.id });
  return NextResponse.json(result, { status: "status" in result ? result.status : 201 });
}
