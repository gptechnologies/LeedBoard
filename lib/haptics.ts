export type HapticIntent = "selection" | "light" | "success" | "warning" | "notification" | "medium";

const patterns: Record<HapticIntent, number | number[]> = {
  selection: 8,
  light: 14,
  success: [18, 24, 18],
  warning: [26, 38, 26],
  notification: [18, 24, 18],
  medium: [18, 24, 18],
};

export function triggerHaptic(intent: HapticIntent = "light") {
  if (typeof window === "undefined" || !("vibrate" in navigator)) return;

  try {
    navigator.vibrate(patterns[intent]);
  } catch {
    // Haptics are a progressive enhancement and must never block the action.
  }
}
