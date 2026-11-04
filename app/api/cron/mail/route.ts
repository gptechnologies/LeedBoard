import { processMailQueue } from "@/lib/mail-queue";
export const maxDuration = 60;
export async function GET(r: Request) {
  if (
    !process.env.CRON_SECRET ||
    r.headers.get("authorization") !== `Bearer ${process.env.CRON_SECRET}`
  )
    return new Response("Unauthorized", { status: 401 });
  await processMailQueue();
  await processMailQueue();
  return Response.json({ ok: true });
}
