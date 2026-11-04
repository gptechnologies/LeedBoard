import { NextResponse, after } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireApiUser } from "@/lib/session";
import { parseQuickPost } from "@/lib/quick-post";
import { createJobReference } from "@/lib/providers";
import { queueLeadJob, processMailQueue } from "@/lib/mail-queue";
export async function POST(request: Request) {
  const user = await requireApiUser(request, "CUSTOMER");
  if (user instanceof NextResponse) return user;
  let postingKey = "";
  try {
    const input = parseQuickPost(await request.formData());
    postingKey = input.postingKey;
    const job = await prisma.$transaction(async (tx) => {
      const existing = await tx.jobRequest.findUnique({
        where: { postingKey: input.postingKey },
      });
      if (existing) {
        if (existing.customerId !== user.id)
          throw new Error("Invalid request.");
        return existing;
      }
      const recent = await tx.jobRequest.count({
        where: {
          customerId: user.id,
          createdAt: { gte: new Date(Date.now() - 600000) },
        },
      });
      if (recent >= 5)
        throw new Error(
          "You have several recent requests. Review them in My jobs before posting another.",
        );
      const job = await tx.jobRequest.create({
        data: {
          ...input,
          customerId: user.id,
          publicReference: createJobReference(),
          acceptanceDeadline: new Date(Date.now() + 7 * 86400000),
        },
      });
      await queueLeadJob(job.id, tx);
      return job;
    });
    after(async () => {
      await processMailQueue();
      await processMailQueue();
    });
    return NextResponse.json({ jobId: job.id });
  } catch (e) {
    if ((e as { code?: string }).code === "P2002" && postingKey) {
      const existing = await prisma.jobRequest.findFirst({
        where: { postingKey, customerId: user.id },
        select: { id: true },
      });
      if (existing) return NextResponse.json({ jobId: existing.id });
    }
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Unable to post. Try again." },
      { status: 400 },
    );
  }
}
