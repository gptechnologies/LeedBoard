import { after, NextResponse } from "next/server";
import { requireApiUser } from "@/lib/session";
import { enrollLead } from "@/lib/enrollment";
import { processMailQueue } from "@/lib/mail-queue";
export async function POST(r: Request) {
  const u = await requireApiUser(r, "ADMIN");
  if (u instanceof NextResponse) return u;
  try {
    await enrollLead(await r.formData());
    after(processMailQueue);
    return NextResponse.redirect(new URL("/admin/leads", r.url), 303);
  } catch (e) {
    return NextResponse.redirect(
      new URL(
        "/admin/leads?error=" +
          encodeURIComponent(
            e instanceof Error ? e.message : "Unable to add lead",
          ),
        r.url,
      ),
      303,
    );
  }
}
