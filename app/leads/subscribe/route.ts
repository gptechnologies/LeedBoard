import { after, NextResponse } from "next/server";
import { enrollLead } from "@/lib/enrollment";
import { processMailQueue } from "@/lib/mail-queue";
export async function POST(r: Request) {
  try {
    await enrollLead(await r.formData());
    after(processMailQueue);
    return NextResponse.redirect(new URL("/leads?sent=1", r.url), 303);
  } catch (e) {
    return NextResponse.redirect(
      new URL(
        "/leads?error=" +
          encodeURIComponent(
            e instanceof Error ? e.message : "Unable to subscribe",
          ),
        r.url,
      ),
      303,
    );
  }
}
