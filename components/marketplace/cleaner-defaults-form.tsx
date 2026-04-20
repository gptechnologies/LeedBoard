type CleanerDefaultsFormProps = {
  defaults: {
    standardHourlyRateCents: number | null;
    standardFlatRateCents: number | null;
    standardDeepCleanFlatRateCents: number | null;
    defaultEtaMinutes: number | null;
  };
};

export function CleanerDefaultsForm({ defaults }: CleanerDefaultsFormProps) {
  return (
    <form action="/cleaner/settings/save" method="post" className="market-card">
      <div className="market-section-heading">
        <h2>Standard bid defaults</h2>
      </div>
      <div className="grid two">
        <div className="field">
          <label htmlFor="standardHourlyRate">Hourly rate</label>
          <input
            id="standardHourlyRate"
            name="standardHourlyRate"
            inputMode="decimal"
            defaultValue={
              defaults.standardHourlyRateCents
                ? (defaults.standardHourlyRateCents / 100).toFixed(0)
                : ""
            }
          />
        </div>
        <div className="field">
          <label htmlFor="standardFlatRate">Standard flat fee</label>
          <input
            id="standardFlatRate"
            name="standardFlatRate"
            inputMode="decimal"
            defaultValue={
              defaults.standardFlatRateCents
                ? (defaults.standardFlatRateCents / 100).toFixed(0)
                : ""
            }
          />
        </div>
      </div>
      <div className="grid two">
        <div className="field">
          <label htmlFor="standardDeepCleanFlatRate">Deep clean flat fee</label>
          <input
            id="standardDeepCleanFlatRate"
            name="standardDeepCleanFlatRate"
            inputMode="decimal"
            defaultValue={
              defaults.standardDeepCleanFlatRateCents
                ? (defaults.standardDeepCleanFlatRateCents / 100).toFixed(0)
                : ""
            }
          />
        </div>
        <div className="field">
          <label htmlFor="defaultEtaMinutes">Default ASAP ETA</label>
          <input
            id="defaultEtaMinutes"
            name="defaultEtaMinutes"
            inputMode="numeric"
            defaultValue={defaults.defaultEtaMinutes ?? ""}
          />
        </div>
      </div>
      <div className="market-card__actions">
        <button type="submit">Save Defaults</button>
      </div>
    </form>
  );
}
