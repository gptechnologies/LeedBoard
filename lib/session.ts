import { auth, currentUser as getClerkCurrentUser } from "@clerk/nextjs/server";
import { UserRole } from "@prisma/client";
import { redirect } from "next/navigation";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

function normalizeEmail(value: string) {
  return value.trim().toLowerCase();
}

function getClerkPrimaryEmail(
  clerkUser: Awaited<ReturnType<typeof getClerkCurrentUser>>,
) {
  const email =
    clerkUser?.primaryEmailAddress?.emailAddress ??
    clerkUser?.emailAddresses.find((item) => item.id === clerkUser.primaryEmailAddressId)
      ?.emailAddress ??
    clerkUser?.emailAddresses[0]?.emailAddress;

  return email ? normalizeEmail(email) : null;
}

export function getRoleHome(role: UserRole) {
  if (role === UserRole.CLEANER) {
    return "/cleaner";
  }

  if (role === UserRole.ADMIN) {
    return "/admin";
  }

  return "/customer";
}

async function findOrAttachUser(clerkUserId: string) {
  const byClerkId = await prisma.user.findUnique({
    where: { clerkUserId },
    include: {
      cleanerProfile: true,
    },
  });

  if (byClerkId) {
    return byClerkId;
  }

  const clerkUser = await getClerkCurrentUser();
  const email = getClerkPrimaryEmail(clerkUser);

  if (!clerkUser || !email) {
    return null;
  }

  const existing = await prisma.user.findUnique({
    where: { email },
    include: {
      cleanerProfile: true,
    },
  });

  if (!existing) {
    return null;
  }

  return prisma.user.update({
    where: { id: existing.id },
    data: {
      clerkUserId,
      email,
      firstName: clerkUser.firstName?.trim() || existing.firstName,
      lastName: clerkUser.lastName?.trim() || existing.lastName,
    },
    include: {
      cleanerProfile: true,
    },
  });
}

export async function getCurrentUser() {
  const { userId } = await auth();

  if (!userId) {
    return null;
  }

  return findOrAttachUser(userId);
}

export async function getSignedInIdentity() {
  const { userId } = await auth();

  if (!userId) {
    return null;
  }

  const clerkUser = await getClerkCurrentUser();
  const email = getClerkPrimaryEmail(clerkUser);

  if (!clerkUser || !email) {
    return null;
  }

  return {
    clerkUserId: userId,
    email,
    firstName: clerkUser.firstName?.trim() || "",
    lastName: clerkUser.lastName?.trim() || "",
  };
}

export async function requireSignedInIdentity() {
  const identity = await getSignedInIdentity();

  if (!identity) {
    redirect("/login");
  }

  return identity;
}

export async function requireUser(role?: UserRole) {
  const { userId } = await auth();

  if (!userId) {
    redirect("/login");
  }

  const user = await findOrAttachUser(userId);

  if (!user) {
    redirect("/welcome");
  }

  if (role && user.role !== role) {
    redirect(getRoleHome(user.role));
  }

  return user;
}

export async function requireApiUser(request: Request, role?: UserRole) {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  const user = await findOrAttachUser(userId);

  if (!user) {
    return NextResponse.redirect(new URL("/welcome", request.url));
  }

  if (role && user.role !== role) {
    return NextResponse.redirect(new URL(getRoleHome(user.role), request.url));
  }

  return user;
}
