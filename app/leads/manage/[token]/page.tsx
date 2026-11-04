import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
export const dynamic = "force-dynamic";
export default async function Manage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const l = await prisma.cleanerLead.findUnique({
    where: { subscriptionToken: token },
  });
  if (!l) notFound();
  return (
    <form
      className="effortless-form"
      method="post"
      action={`/leads/manage/${token}/save`}
    >
      <header>
        <h1>Your cleaning leads</h1>
        <p>
          {l.businessName} · {l.email}
        </p>
        <p>
          {!l.emailConfirmedAt
            ? "Confirm your email to receive leads."
            : l.optedOutAt
              ? "You are unsubscribed."
              : l.pausedAt
                ? "Your leads are paused."
                : "Your leads are active."}
        </p>
      </header>
      <label>
        Service ZIPs
        <input
          required
          name="zips"
          defaultValue={l.serviceAreaPostalCodes.join(", ")}
        />
      </label>
      <button className="effortless-primary" name="action" value="activate">
        {l.emailConfirmedAt
          ? "Save and receive leads"
          : "Confirm email & receive leads"}
      </button>
      <button className="effortless-secondary" name="action" value="pause">
        Pause leads
      </button>
      <button
        className="effortless-secondary"
        name="action"
        value="unsubscribe"
      >
        Unsubscribe
      </button>
    </form>
  );
}
