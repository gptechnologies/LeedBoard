import { prisma } from "@/lib/prisma";
import { parseZip } from "@/lib/lead-policy";
import { NextResponse } from "next/server";
export async function POST(
  r: Request,
  { params }: { params: Promise<{ token: string }> },
) {
  const { token } = await params;
  const l = await prisma.cleanerLead.findUnique({
    where: { subscriptionToken: token },
  });
  if (!l) return new Response("Link not found", { status: 404 });
  const f = await r.formData();
  const action = f.get("action");
  try {
    const zips = String(f.get("zips"))
      .split(",")
      .map((x) => parseZip(x.trim()));
    await prisma.cleanerLead.update({
      where: { id: l.id },
      data:
        action === "activate"
          ? {
              serviceAreaPostalCodes: zips,
              postalCode: zips[0],
              emailConfirmedAt: new Date(),
              consentedAt: new Date(),
              optedOutAt: null,
              pausedAt: null,
            }
          : action === "pause"
            ? { pausedAt: new Date() }
            : { optedOutAt: new Date() },
    });
    return NextResponse.redirect(new URL("/leads/manage/" + token, r.url), 303);
  } catch {
    return new Response(
      "Enter valid five-digit ZIP codes, separated by commas.",
      { status: 400 },
    );
  }
}
