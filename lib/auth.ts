export function getRequiredString(value: FormDataEntryValue | null, label: string) {
  if (!value || typeof value !== "string" || value.trim() === "") {
    throw new Error(`${label} is required.`);
  }

  return value.trim();
}
