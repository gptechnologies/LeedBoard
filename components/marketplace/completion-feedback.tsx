"use client";

import { useEffect } from "react";

import { triggerHaptic } from "@/lib/haptics";

export function CompletionFeedback() {
  useEffect(() => {
    triggerHaptic("success");
  }, []);

  return null;
}
