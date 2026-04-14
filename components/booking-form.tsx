"use client";

import { useState } from "react";
import type { AddOn, CleanerProfile, Service, TimeSlot, User } from "@prisma/client";
import { formatCurrency, formatDateTimeRange } from "@/lib/format";
import { SubmitButton } from "@/components/submit-button";

type Cleaner = User & {
  cleanerProfile: CleanerProfile | null;
};

type BookingFormProps = {
  services: Service[];
  addOns: AddOn[];
  cleaners: Cleaner[];
  slots: TimeSlot[];
};

export function BookingForm({ services, addOns, cleaners, slots }: BookingFormProps) {
  const [selectedServiceId, setSelectedServiceId] = useState(services[0]?.id ?? "");
  const [selectedAddOnIds, setSelectedAddOnIds] = useState<string[]>([]);
  const [bedrooms, setBedrooms] = useState(2);
  const [bathrooms, setBathrooms] = useState(1);

  const service = services.find((item) => item.id === selectedServiceId) ?? services[0];
  const selectedAddOns = addOns.filter((item) => selectedAddOnIds.includes(item.id));
  const bedroomAdjustment = Math.max(0, bedrooms - 1) * 1500;
  const bathroomAdjustment = Math.max(0, Math.ceil(bathrooms - 1)) * 1000;
  const subtotal = (service?.basePriceCents ?? 0) + bedroomAdjustment + bathroomAdjustment;
  const addOnTotal = selectedAddOns.reduce((sum, item) => sum + item.priceCents, 0);
  const tax = Math.round((subtotal + addOnTotal) * 0.08);
  const total = subtotal + addOnTotal + tax;

  return (
    <form action="/api/bookings/create-checkout" method="post" className="booking-layout booking-layout--premium">
      <div className="panel panel-form stack">
        <div className="stack small">
          <div className="eyebrow">Reserve your visit</div>
          <h1>Schedule a cleaning with clear pricing and a confirmed arrival window.</h1>
          <p className="subtle">
            Tell us about your home, choose the service that fits, and secure your visit
            in just a few steps.
          </p>
        </div>

        <section className="form-section stack">
          <div className="form-section__header">
            <h2>1. Choose your service</h2>
            <p className="subtle">Select the visit type, your preferred professional, and an available arrival window.</p>
          </div>

          <div className="field-grid">
            <div className="field">
              <label htmlFor="serviceId">Cleaning service</label>
            <select
              id="serviceId"
              name="serviceId"
              value={selectedServiceId}
              onChange={(event) => setSelectedServiceId(event.target.value)}
              required
            >
              {services.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name} · {formatCurrency(item.basePriceCents)}
                </option>
              ))}
            </select>
            </div>

            <div className="field">
              <label htmlFor="cleanerId">Preferred professional</label>
            <select id="cleanerId" name="cleanerId" required>
              {cleaners.map((cleaner) => (
                <option key={cleaner.id} value={cleaner.id}>
                  {cleaner.firstName} {cleaner.lastName}
                </option>
              ))}
            </select>
            </div>

            <div className="field">
              <label htmlFor="slotId">Arrival window</label>
            <select id="slotId" name="slotId" required>
              {slots.map((slot) => (
                <option key={slot.id} value={slot.id}>
                  {formatDateTimeRange(new Date(slot.startsAt), new Date(slot.endsAt))}
                </option>
              ))}
            </select>
            </div>

            <div className="field">
              <label htmlFor="phone">Mobile number</label>
              <input id="phone" name="phone" placeholder="Optional for arrival updates" />
            </div>
          </div>
        </section>

        <section className="form-section stack">
          <div className="form-section__header">
            <h2>2. Tell us about the home</h2>
            <p className="subtle">These details help us prepare the right amount of time and care for your visit.</p>
          </div>

          <div className="field-grid">
            <div className="field">
              <label htmlFor="bedrooms">Bedrooms</label>
            <input
              id="bedrooms"
              name="bedrooms"
              type="number"
              min="0"
              value={bedrooms}
              onChange={(event) => setBedrooms(Number(event.target.value))}
              required
            />
            </div>

            <div className="field">
              <label htmlFor="bathrooms">Bathrooms</label>
            <input
              id="bathrooms"
              name="bathrooms"
              type="number"
              min="1"
              step="0.5"
              value={bathrooms}
              onChange={(event) => setBathrooms(Number(event.target.value))}
              required
            />
            </div>
          </div>

          <div className="field-grid">
            <div className="field">
              <label htmlFor="addressLine1">Street address</label>
            <input id="addressLine1" name="addressLine1" required />
            </div>
            <div className="field">
              <label htmlFor="addressLine2">Apartment, suite, or entry</label>
            <input id="addressLine2" name="addressLine2" />
            </div>
            <div className="field">
              <label htmlFor="city">City</label>
            <input id="city" name="city" required />
            </div>
            <div className="field">
              <label htmlFor="state">State</label>
            <input id="state" name="state" required defaultValue="NY" />
            </div>
            <div className="field">
              <label htmlFor="postalCode">ZIP code</label>
            <input id="postalCode" name="postalCode" required />
            </div>
          </div>
        </section>

        <section className="form-section stack">
          <div className="form-section__header">
            <h2>3. Personalize your visit</h2>
            <p className="subtle">Add specialty tasks and leave any access details your provider should have before arrival.</p>
          </div>

          <div className="field">
            <label>Add-on services</label>
          <div className="grid two">
            {addOns.map((addOn) => {
              const checked = selectedAddOnIds.includes(addOn.id);

              return (
                <label key={addOn.id} className="service-card service-card--selectable">
                  <input
                    type="checkbox"
                    name="addOnId"
                    value={addOn.id}
                    checked={checked}
                    onChange={(event) => {
                      if (event.target.checked) {
                        setSelectedAddOnIds((current) => [...current, addOn.id]);
                        return;
                      }

                      setSelectedAddOnIds((current) =>
                        current.filter((item) => item !== addOn.id),
                      );
                    }}
                  />
                  <div className="selectable-card__body">
                    <strong>{addOn.name}</strong>
                    <div className="subtle">{addOn.description}</div>
                    <div>{formatCurrency(addOn.priceCents)}</div>
                  </div>
                </label>
              );
            })}
          </div>
          </div>

          <div className="field">
            <label htmlFor="notes">Entry notes and preferences</label>
            <textarea
              id="notes"
              name="notes"
              placeholder="Gate code, parking instructions, pet notes, or anything else you'd like your provider to know."
            />
          </div>
        </section>

        <SubmitButton>Continue to secure checkout</SubmitButton>
      </div>

      <aside className="panel summary-panel stack">
        <div className="stack small">
          <div className="eyebrow">Visit summary</div>
          <h2>Your live estimate</h2>
          <p className="subtle">
            Your total updates instantly as you adjust the home details and optional
            services.
          </p>
        </div>

        <div className="price-list">
          <div className="price-line">
            <span>{service?.name ?? "Service"}</span>
            <span>{formatCurrency(service?.basePriceCents ?? 0)}</span>
          </div>
          <div className="price-line">
            <span>Home size adjustment</span>
            <span>{formatCurrency(subtotal - (service?.basePriceCents ?? 0))}</span>
          </div>
          <div className="price-line">
            <span>Add-ons</span>
            <span>{formatCurrency(addOnTotal)}</span>
          </div>
          <div className="price-line">
            <span>Tax</span>
            <span>{formatCurrency(tax)}</span>
          </div>
          <div className="price-line total">
            <span>Total</span>
            <span>{formatCurrency(total)}</span>
          </div>
        </div>

        <div className="summary-promise">
          <strong>Included with every booking</strong>
          <div className="subtle">Clear pricing, confirmed arrival windows, and visible support details from booking through completion.</div>
        </div>
      </aside>
    </form>
  );
}
