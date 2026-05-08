"use client";

import { useAuth } from "@clerk/nextjs";
import { UserRole } from "@prisma/client";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect } from "react";

export function ContinueBridge() {
  const { isLoaded, isSignedIn } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const roleParam = searchParams.get("role");
  const role = roleParam === UserRole.CLEANER ? UserRole.CLEANER : UserRole.CUSTOMER;

  useEffect(() => {
    if (!isLoaded) {
      return;
    }

    if (!isSignedIn) {
      router.replace("/login");
      return;
    }

    router.refresh();
    router.replace(`/welcome?role=${role}`);
  }, [isLoaded, isSignedIn, role, router]);

  return null;
}
