import { redirect } from "next/navigation";
export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ repost?: string }>;
}) {
  const p = await searchParams;
  redirect(
    "/customer?compose=1" +
      (p.repost ? "&repost=" + encodeURIComponent(p.repost) : ""),
  );
}
