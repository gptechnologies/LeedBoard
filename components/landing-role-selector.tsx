"use client";

import Link from "next/link";
import { ArrowRight, Check, House, UserRound } from "lucide-react";
import { useState } from "react";

type Audience = "homeowner" | "cleaner";

const audienceContent: Record<
  Audience,
  {
    eyebrow: string;
    title: string;
    description: string;
    benefits: string[];
    cta: string;
    href: string;
  }
> = {
  homeowner: {
    eyebrow: "For homeowners",
    title: "Post once. Let cleaners come to you.",
    description:
      "Tell us what you need cleaned and local cleaners can send you their price and availability.",
    benefits: [
      "Post your cleaning job for free.",
      "Get offers from nearby cleaners.",
      "Compare price, availability, and cleaner details in one place.",
      "Message cleaners before choosing.",
      "No commitment — choose a cleaner only when you're ready.",
    ],
    cta: "Find a cleaner",
    href: "/login",
  },
  cleaner: {
    eyebrow: "For cleaners",
    title: "Get quality leads and fill your schedule.",
    description:
      "Find real jobs from local homeowners and grow your cleaning business.",
    benefits: [
      "Receive free leads and real-time job alerts.",
      "No cost to bid. No cost to use the app.",
      "Send your total price and earliest availability.",
      "No sign-up required.",
      "Receive leads and reply by email. No app needed.",
    ],
    cta: "Get cleaning leads",
    href: "/leads",
  },
};

export function LandingRoleSelector() {
  const [audience, setAudience] = useState<Audience>("homeowner");
  const content = audienceContent[audience];

  return (
    <section className="landing-audience" aria-label="How Well Kept works">
      <p className="landing-audience__statement">
        A clean home.
        <br />A simpler way to find help.
      </p>

      <div
        className="landing-audience__toggle"
        role="group"
        aria-label="Choose an audience"
      >
        <span
          className="landing-audience__slider"
          data-audience={audience}
          aria-hidden="true"
        />
        <button
          type="button"
          aria-pressed={audience === "homeowner"}
          onClick={() => setAudience("homeowner")}
        >
          <House aria-hidden="true" />
          Homeowners
        </button>
        <button
          type="button"
          aria-pressed={audience === "cleaner"}
          onClick={() => setAudience("cleaner")}
        >
          <UserRound aria-hidden="true" />
          Cleaners
        </button>
      </div>

      <article className="landing-audience-card" aria-live="polite">
        <div className="landing-audience-card__copy">
          <p className="landing-audience-card__eyebrow">{content.eyebrow}</p>
          <h2>{content.title}</h2>
          <p className="landing-audience-card__description">
            {content.description}
          </p>
          <ul className="landing-audience-card__list">
            {content.benefits.map((benefit) => (
              <li key={benefit}>
                <span className="landing-audience-card__check">
                  <Check aria-hidden="true" />
                </span>
                <span>{benefit}</span>
              </li>
            ))}
          </ul>
        </div>
        <Link className="landing-audience-card__action" href={content.href}>
          {content.cta}
          <ArrowRight aria-hidden="true" />
        </Link>
      </article>
    </section>
  );
}
