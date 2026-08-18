import Link from "next/link";
import {
  BedDouble,
  ChevronRight,
  DoorOpen,
  Home,
  PawPrint,
} from "lucide-react";
import { UserRole } from "@prisma/client";
import { AppScreenHeader } from "@/components/marketplace/app-screen-header";
import { getCustomerHomeData } from "@/lib/marketplace";
import { requireUser } from "@/lib/session";

export const dynamic = "force-dynamic";

export default async function CustomerAccountPage() {
  const user = await requireUser(UserRole.CUSTOMER);
  const { homeProfile } = await getCustomerHomeData(user.id);
  const fullName = `${user.firstName} ${user.lastName}`;
  const initials = `${user.firstName.charAt(0)}${user.lastName.charAt(0)}`.toUpperCase();

  return (
    <div className="wk-app-screen wk-profile-screen">
      <AppScreenHeader
        accountMenu
        initials={initials}
      />

      <div className="wk-screen-content">
        <section className="wk-profile-intro">
          <span className="wk-profile-avatar">{initials}</span>
          <div>
            <small>Welcome back,</small>
            <h1>{fullName}</h1>
            <strong>Homeowner</strong>
            <p>{homeProfile ? `${homeProfile.city}, ${homeProfile.state}` : "Add your home location"}</p>
          </div>
        </section>

        <Link className="wk-profile-card" href="/customer/my-home">
          <div className="wk-profile-card__heading">
            <h2>Your Home</h2>
            <span>Edit <ChevronRight aria-hidden="true" /></span>
          </div>
          {homeProfile ? (
            <>
              <div className="wk-home-grid wk-home-grid--summary">
                <ProfileMetric
                  Icon={Home}
                  label={homeProfile.addressLine1}
                  sublabel={`${homeProfile.city}, ${homeProfile.state} ${homeProfile.postalCode}`}
                />
                <ProfileMetric
                  Icon={Home}
                  label={homeProfile.propertyType === "APARTMENT" ? "Apartment" : "Single-family"}
                  sublabel={homeProfile.estimatedSquareFeet ? `${homeProfile.estimatedSquareFeet.toLocaleString()} sq ft` : "Size not added"}
                />
                <ProfileMetric
                  Icon={BedDouble}
                  label={`${homeProfile.bedroomCount ? `${homeProfile.bedroomCount} bedrooms` : "Bedrooms not added"} · ${homeProfile.bathroomCount ? `${formatNumber(homeProfile.bathroomCount)} bathrooms` : "Bathrooms not added"}`}
                  sublabel="Rooms"
                />
              </div>
            </>
          ) : (
            <div className="wk-inline-empty">Add your address and home details.</div>
          )}
        </Link>

        <ProfileSection title="Home settings">
          <ProfileRow href="/customer/my-home" Icon={DoorOpen} label="Address and access" />
          <ProfileRow href="/customer/my-home" Icon={PawPrint} label="Home details and pets" />
        </ProfileSection>
      </div>
    </div>
  );
}

function ProfileMetric({
  Icon,
  label,
  sublabel,
}: {
  Icon: React.ComponentType<{ "aria-hidden"?: boolean }>;
  label: string;
  sublabel?: string;
}) {
  return (
    <div className="wk-profile-metric">
      <Icon />
      <span><strong>{label}</strong>{sublabel ? <small>{sublabel}</small> : null}</span>
    </div>
  );
}

function ProfileSection({ children, title }: { children: React.ReactNode; title: string }) {
  return (
    <section className="wk-profile-section">
      <h2>{title}</h2>
      <div>{children}</div>
    </section>
  );
}

function ProfileRow({
  href,
  Icon,
  label,
}: {
  href: string;
  Icon: React.ComponentType<{ "aria-hidden"?: boolean }>;
  label: string;
}) {
  return (
    <Link className="wk-profile-row" href={href}>
      <Icon />
      <span>{label}</span>
      <ChevronRight aria-hidden="true" />
    </Link>
  );
}

function formatNumber(value: number) {
  return Number.isInteger(value) ? value.toFixed(0) : value.toString();
}
