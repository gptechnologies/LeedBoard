import { NextResponse } from "next/server";
import { clearSessionCookie, destroyCurrentSession } from "@/lib/session";

export async function POST(request: Request) {
  await destroyCurrentSession();
  const response = NextResponse.redirect(new URL("/", request.url));
  clearSessionCookie(response);
  return response;
}

