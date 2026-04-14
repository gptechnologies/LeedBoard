import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { getCurrentUser, getRoleHome } from "@/lib/session";

type ContinuePageProps = {
  searchParams: Promise<{
    role?: string;
  }>;
};

export default async function ContinuePage({ searchParams }: ContinuePageProps) {
  const params = await searchParams;
  const [{ userId }, user] = await Promise.all([auth(), getCurrentUser()]);

  if (!userId) {
    redirect("/login");
  }

  if (user) {
    redirect(getRoleHome(user.role));
  }

  const query = params.role ? `?role=${encodeURIComponent(params.role)}` : "";
  redirect(`/welcome${query}`);
}
