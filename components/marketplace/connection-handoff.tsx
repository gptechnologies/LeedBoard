import { Check, MapPin, Phone } from "lucide-react";

export function ConnectionHandoff({
  address,
  homeownerName,
  homeownerPhone,
  providerName,
  providerPhone,
}: {
  address: string;
  homeownerName: string;
  homeownerPhone: string | null;
  providerName: string;
  providerPhone: string | null;
}) {
  return (
    <section className="wk-connection-handoff" aria-labelledby="connection-handoff-title">
      <header>
        <span aria-hidden="true"><Check /></span>
        <div>
          <p>Connection confirmed</p>
          <h2 id="connection-handoff-title">Coordinate directly from here</h2>
        </div>
      </header>
      <p>Well Kept has closed this message thread and emailed both of you a copy. Use the details below for any next steps.</p>
      <dl>
        <div><dt><Phone aria-hidden="true" /> Homeowner</dt><dd>{homeownerName}<br />{homeownerPhone ? <a href={`tel:${homeownerPhone}`}>{homeownerPhone}</a> : "Phone unavailable"}</dd></div>
        <div><dt><Phone aria-hidden="true" /> Provider</dt><dd>{providerName}<br />{providerPhone ? <a href={`tel:${providerPhone}`}>{providerPhone}</a> : "Phone unavailable"}</dd></div>
        <div><dt><MapPin aria-hidden="true" /> Job address</dt><dd>{address}</dd></div>
      </dl>
    </section>
  );
}
