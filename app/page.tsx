import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { formatCurrency } from "@/lib/format";
import { getCurrentUser, getRoleHome } from "@/lib/session";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const [services, user] = await Promise.all([
    prisma.service.findMany({
      where: { isActive: true },
      orderBy: { basePriceCents: "asc" },
    }),
    getCurrentUser(),
  ]);

  return (
    <div className="stack">
      <section className="hero hero-premium">
        <div className="stack">
          <div className="eyebrow">Trusted home care, beautifully handled</div>
          <h1>Exceptional home cleaning with effortless booking.</h1>
          <p>
            Schedule a premium cleaning in minutes, choose the time that fits your week,
            and keep every visit organized from confirmation to completion.
          </p>
          <div className="hero-actions">
            <Link
              href={user ? getRoleHome(user.role) : "/signup?role=CUSTOMER"}
              className="button-link"
            >
              {user ? "Open my account" : "Book now"}
            </Link>
            <Link href="/login" className="button-link secondary">
              Returning customer
            </Link>
          </div>
          <div className="inline-metrics">
            <div className="metric-pill">
              <strong>Transparent pricing</strong>
              <span>Real-time estimate before checkout</span>
            </div>
            <div className="metric-pill">
              <strong>Arrival windows</strong>
              <span>Clear scheduling and status updates</span>
            </div>
          </div>
        </div>

        <div className="hero-visual">
          <div className="hero-capsule">
            <div className="hero-capsule__glow" />
            <div className="hero-capsule__home">
              <div className="hero-capsule__roof" />
              <div className="hero-capsule__door" />
            </div>
          </div>
          <div className="hero-floating-card hero-floating-card--top">
            <span>Next available</span>
            <strong>Tomorrow, 9 AM - 12 PM</strong>
          </div>
          <div className="hero-floating-card hero-floating-card--bottom">
            <span>Service standard</span>
            <strong>Fully confirmed before arrival</strong>
          </div>
        </div>
      </section>

      <section className="grid three">
        <article className="feature-card stack small">
          <div className="eyebrow">Booking</div>
          <h2>Reserve in a few quick steps</h2>
          <p className="subtle">
            Select your service, confirm your home details, and secure your visit with a
            polished checkout experience.
          </p>
        </article>
        <article className="feature-card stack small">
          <div className="eyebrow">Service</div>
          <h2>Know exactly what to expect</h2>
          <p className="subtle">
            Arrival windows, service notes, and live visit status are all available from
            one clear booking page.
          </p>
        </article>
        <article className="feature-card stack small">
          <div className="eyebrow">Support</div>
          <h2>Premium care, before and after your visit</h2>
          <p className="subtle">
            Every booking is backed by visible support details and straightforward visit
            management.
          </p>
        </article>
      </section>

      <section className="section-shell stack">
        <div className="section-heading">
          <div className="eyebrow">Services</div>
          <h2>Choose the level of care that fits your home.</h2>
          <p className="subtle">
            Each service is built around transparent pricing, careful execution, and a
            streamlined booking experience.
          </p>
        </div>

        <section className="grid three">
        {services.map((service) => (
          <article key={service.id} className="service-card service-card--premium stack small">
            <h2>{service.name}</h2>
            <p className="subtle">{service.description}</p>
            <strong>From {formatCurrency(service.basePriceCents)}</strong>
            <span className="subtle">Typically around {service.durationMinutes} minutes</span>
          </article>
        ))}
        </section>
      </section>
    </div>
  );
}
