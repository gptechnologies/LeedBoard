"use client";

import Link from "next/link";
import { ArrowRight, Check, House, UsersRound } from "lucide-react";
import { useState } from "react";

import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { cn } from "@/lib/utils";

type Audience = "CUSTOMER" | "CLEANER";

const audiences: Record<Audience, {
  action: string;
  description: string;
  Icon: typeof House;
  label: string;
  points: string[];
}> = {
  CUSTOMER: {
    action: "For homeowners",
    description: "Book a trusted cleaner without the back-and-forth.",
    Icon: House,
    label: "For homeowners",
    points: [
      "Post a cleaning job in under 20 seconds.",
      "We notify top nearby cleaners for you.",
      "Compare bids and availability in one place.",
      "Choose the cleaner that works best for you.",
      "Contact info is shared only after you accept a bid and confirm the cleaner.",
      "Your address and contact details stay private until you confirm a cleaner.",
    ],
  },
  CLEANER: {
    action: "For cleaners",
    description: "Get quality leads and fill open time fast.",
    Icon: UsersRound,
    label: "For cleaners",
    points: [
      "Receive free leads and real-time job alerts.",
      "No cost to bid. No cost to use the app.",
      "You only pay when a homeowner accepts your bid and confirms you as the cleaner.",
      "No sign-up required.",
      "We can send leads by SMS and email, subject to business approval.",
    ],
  },
};

export function LandingRoleSelector() {
  const [selected, setSelected] = useState<Audience>("CUSTOMER");

  return (
    <section className="landing-audience" aria-label="Choose how Well Kept can help">
      <p className="landing-audience__statement">Well Kept is like DoorDash for home cleaning.</p>

      <ToggleGroup
        aria-label="Choose an audience"
        className="landing-audience__toggle"
        onValueChange={(value) => {
          if (value === "CUSTOMER" || value === "CLEANER") setSelected(value);
        }}
        type="single"
        value={selected}
      >
        {(Object.keys(audiences) as Audience[]).map((audience) => (
          <ToggleGroupItem key={audience} value={audience}>
            {audiences[audience].action}
            <ArrowRight aria-hidden="true" />
          </ToggleGroupItem>
        ))}
      </ToggleGroup>

      <div className="landing-audience__cards">
        {(Object.keys(audiences) as Audience[]).map((audience) => (
          <AudienceCard
            audience={audience}
            data={audiences[audience]}
            key={audience}
            selected={selected === audience}
          />
        ))}
      </div>
    </section>
  );
}

function AudienceCard({
  audience,
  data,
  selected,
}: {
  audience: Audience;
  data: (typeof audiences)[Audience];
  selected: boolean;
}) {
  const { Icon } = data;

  return (
    <article className={cn("landing-audience-card", !selected && "is-inactive")} data-audience={audience}>
      <div className="landing-audience-card__heading">
        <span className="landing-audience-card__icon" aria-hidden="true"><Icon /></span>
        <div>
          <h2>{data.label}</h2>
          <p>{data.description}</p>
        </div>
      </div>

      <ul className="landing-audience-card__list">
        {data.points.map((point) => (
          <li key={point}><Check aria-hidden="true" /><span>{point}</span></li>
        ))}
      </ul>

      <Link className="landing-audience-card__action" href={`/signup?role=${audience}`}>
        Sign up / Log in
        <ArrowRight aria-hidden="true" />
      </Link>
    </article>
  );
}
