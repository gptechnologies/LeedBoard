import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { PriceInput } from "@/components/marketplace/price-input";

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
    <Card>
      <form action="/cleaner/settings/save" method="post">
        <CardHeader>
          <CardTitle>Standard bid defaults</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="field">
          <label htmlFor="standardHourlyRate">Hourly rate</label>
          <PriceInput
            id="standardHourlyRate"
            name="standardHourlyRate"
            defaultValue={
              defaults.standardHourlyRateCents
                ? (defaults.standardHourlyRateCents / 100).toFixed(0)
                : ""
            }
          />
        </div>
        <div className="field">
          <label htmlFor="standardFlatRate">Standard flat fee</label>
          <PriceInput
            id="standardFlatRate"
            name="standardFlatRate"
            defaultValue={
              defaults.standardFlatRateCents
                ? (defaults.standardFlatRateCents / 100).toFixed(0)
                : ""
            }
          />
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="field">
          <label htmlFor="standardDeepCleanFlatRate">Deep clean flat fee</label>
          <PriceInput
            id="standardDeepCleanFlatRate"
            name="standardDeepCleanFlatRate"
            defaultValue={
              defaults.standardDeepCleanFlatRateCents
                ? (defaults.standardDeepCleanFlatRateCents / 100).toFixed(0)
                : ""
            }
          />
        </div>
        <div className="field">
          <label htmlFor="defaultEtaMinutes">Default ASAP ETA</label>
          <Input
            id="defaultEtaMinutes"
            name="defaultEtaMinutes"
            inputMode="numeric"
            defaultValue={defaults.defaultEtaMinutes ?? ""}
          />
        </div>
      </div>
      <div className="market-card__actions">
        <Button type="submit">Save defaults</Button>
      </div>
        </CardContent>
      </form>
    </Card>
  );
}
