import { after, NextResponse } from "next/server";
import { submitOffer } from "@/lib/submit-offer";
import { processMailQueue } from "@/lib/mail-queue";
export async function POST(
  r: Request,
  { params }: { params: Promise<{ token: string }> },
) {
  const { token } = await params;
  try {
    await submitOffer(token, await r.formData());
    after(processMailQueue);
    return NextResponse.redirect(
      new URL(`/invite/cleaner/${token}?submitted=1`, r.url),
      303,
    );
  } catch (e) {
    return NextResponse.redirect(
      new URL(
        `/invite/cleaner/${token}?edit=1&error=${encodeURIComponent(e instanceof Error ? e.message : "Unable to send bid")}`,
        r.url,
      ),
      303,
    );
  }
}
