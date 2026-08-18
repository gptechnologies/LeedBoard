import {
  Bell,
  CalendarDays,
  CircleDollarSign,
  MapPin,
  MessageSquareText,
  ShieldCheck,
  Sparkles,
  Star,
} from "lucide-react";
import { JobRequestStatus, NotificationChannel, UserRole } from "@prisma/client";
import { AppScreenHeader } from "@/components/marketplace/app-screen-header";
import { CleanerDefaultsForm } from "@/components/marketplace/cleaner-defaults-form";
import { PushNotificationToggle } from "@/components/marketplace/push-notification-toggle";
import { PassedJobsDisclosure } from "@/components/marketplace/passed-jobs-disclosure";
import { getCleaningJobTitle } from "@/lib/job-title";
import { formatTimingSummary, getServiceNeedLabel } from "@/lib/marketplace";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";

export const dynamic = "force-dynamic";

type CleanerAccountPageProps = {
  searchParams: Promise<{ error?: string }>;
};

export default async function CleanerAccountPage({ searchParams }: CleanerAccountPageProps) {
  const user = await requireUser(UserRole.CLEANER);
  const params = await searchParams;
  const profile = user.cleanerProfile;
  const [pushSubscriptionCount, latestPushDelivery, passedJobs] = await Promise.all([
    prisma.pushSubscription.count({ where: { userId: user.id, disabledAt: null } }),
    prisma.notificationDelivery.findFirst({
      where: { userId: user.id, channel: NotificationChannel.PUSH },
      orderBy: { createdAt: "desc" },
      select: { createdAt: true, failureReason: true, status: true },
    }),
    prisma.cleanerJobPass.findMany({
      where: { cleanerId: user.id },
      orderBy: { passedAt: "desc" },
      select: {
        passedAt: true,
        jobRequest: {
          select: {
            id: true,
            title: true,
            city: true,
            state: true,
            serviceNeeds: true,
            cleanType: true,
            currentCondition: true,
            cleanLevel: true,
            timingPreference: true,
            requestedDate: true,
            requestedWindowStart: true,
            requestedWindowEnd: true,
            status: true,
            homeProfile: { select: { propertyType: true } },
          },
        },
      },
    }),
  ]);
  const businessName = profile?.businessName || `${user.firstName} ${user.lastName} Cleaning`;
  const initials = businessName
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part.charAt(0))
    .join("")
    .toUpperCase();
  const primaryService = profile?.serviceNeeds[0]
    ? getServiceNeedLabel(profile.serviceNeeds[0])
    : "Home cleaning";

  return (
    <div className="wk-app-screen wk-profile-screen">
      <AppScreenHeader accountMenu initials={initials} />
      <div className="wk-screen-content">
        {params.error ? <div className="notice error">{params.error}</div> : null}

        <section className="wk-profile-intro wk-business-intro">
          <span className="wk-business-avatar">
            <Sparkles aria-hidden="true" />
            <b>{initials}</b>
          </span>
          <div>
            <h1>{businessName}</h1>
            <strong>Cleaning Business</strong>
            <p><MapPin aria-hidden="true" /> Watervliet, NY</p>
          </div>
        </section>

        <section className="wk-profile-card wk-profile-card--summary">
          <div className="wk-profile-card__heading">
            <h2>Business profile</h2>
          </div>
          <div className="wk-home-grid">
            <BusinessMetric Icon={MapPin} label={`${Math.max(5, profile?.serviceAreaPostalCodes.length ?? 0)} mi radius`} sublabel="Service area" />
            <BusinessMetric Icon={CalendarDays} label={profile?.isAvailable ? "Available" : "Paused"} sublabel="Job availability" />
            <BusinessMetric Icon={ShieldCheck} label={profile?.licensedAndInsured ? "Licensed & insured" : "Insurance not added"} sublabel="Coverage" />
            <BusinessMetric Icon={Sparkles} label={primaryService} sublabel="Main service" />
          </div>
        </section>

        <section className="wk-profile-section">
          <h2>Your account</h2>
          <div>
            <PassedJobsDisclosure jobs={passedJobs.map(({ jobRequest: job, passedAt }) => ({
              id: job.id,
              location: `${job.city}, ${job.state.toUpperCase()}`,
              passedLabel: `Passed ${passedAt.toLocaleDateString("en-US", { month: "short", day: "numeric" })}`,
              status: job.status === JobRequestStatus.OPEN ? "OPEN" : "CLOSED",
              timing: formatTimingSummary(job),
              title: getCleaningJobTitle(job),
            }))} />
            <BusinessRow Icon={CircleDollarSign} label="Rates & bidding defaults" value="Edit below" />
            <BusinessRow Icon={Star} label="Reviews" value={profile?.googleRating?.toFixed(1) || "New"} />
            <BusinessRow Icon={MessageSquareText} label="Contact information" />
            <BusinessRow Icon={Bell} label="Notifications" value={user.pushNotificationsEnabled ? "On" : "Off"} />
          </div>
        </section>

        <details className="wk-settings-details">
          <summary>Advanced business settings</summary>
          <div className="wk-settings-details__content">
            <form action="/cleaner/availability" method="post">
              <input type="hidden" name="isAvailable" value={profile?.isAvailable ? "false" : "true"} />
              <button className="button secondary" type="submit">
                {profile?.isAvailable ? "Pause availability" : "Mark available"}
              </button>
            </form>
            <CleanerDefaultsForm
              defaults={{
                standardHourlyRateCents: profile?.standardHourlyRateCents ?? null,
                standardFlatRateCents: profile?.standardFlatRateCents ?? null,
                standardDeepCleanFlatRateCents: profile?.standardDeepCleanFlatRateCents ?? null,
                defaultEtaMinutes: profile?.defaultEtaMinutes ?? null,
              }}
            />
            <PushNotificationToggle
              enabled={user.pushNotificationsEnabled}
              isConfigured={Boolean(process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY)}
              latestDelivery={
                latestPushDelivery
                  ? {
                      createdAt: latestPushDelivery.createdAt.toISOString(),
                      failureReason: latestPushDelivery.failureReason,
                      status: latestPushDelivery.status,
                    }
                  : null
              }
              publicKey={process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY}
              subscriptionCount={pushSubscriptionCount}
            />
          </div>
        </details>
      </div>
    </div>
  );
}

function BusinessMetric({
  Icon,
  label,
  sublabel,
}: {
  Icon: React.ComponentType<{ "aria-hidden"?: boolean }>;
  label: string;
  sublabel: string;
}) {
  return (
    <div className="wk-profile-metric">
      <Icon />
      <span><strong>{label}</strong><small>{sublabel}</small></span>
    </div>
  );
}

function BusinessRow({
  Icon,
  label,
  value,
}: {
  Icon: React.ComponentType<{ "aria-hidden"?: boolean }>;
  label: string;
  value?: string;
}) {
  return (
    <div className="wk-profile-row">
      <>
        <Icon />
        <span>{label}</span>
        {value ? <strong>{value}</strong> : null}
      </>
    </div>
  );
}
