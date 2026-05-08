import { UserRole } from "@prisma/client";

import { requireUser } from "@/lib/session";

export const dynamic = "force-dynamic";

export default async function CleanerMessagesPage() {
  await requireUser(UserRole.CLEANER);

  return (
    <div className="market-shell market-shell--detail">
      <section className="market-surface">
        <header className="market-topbar market-topbar--detail">
          <div>
            <div className="market-kicker">Messages</div>
            <h1>Cleaner messages.</h1>
          </div>
        </header>

        <section className="market-empty">
          <strong>No messages yet.</strong>
          <p className="market-card__copy">
            Customer conversations for accepted jobs will appear here.
          </p>
        </section>
      </section>
    </div>
  );
}
