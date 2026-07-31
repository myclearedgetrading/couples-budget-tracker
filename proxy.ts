import { NextResponse, type NextRequest } from "next/server";
import { auth } from "@/lib/auth/server";

const neonAuthProxy = auth.middleware({ loginUrl: "/login" });

export async function proxy(request: NextRequest) {
  const response = await neonAuthProxy(request);
  const location = response.headers.get("location");

  if (response.status >= 300 && response.status < 400 && location) {
    const redirectUrl = new URL(location);
    if (redirectUrl.pathname === "/login") {
      // A Server Action POST follows this redirect and gets the login page's
      // HTML, which the client rejects as "an unexpected response". Let the
      // request reach the action instead; requireUser() rejects it with a
      // message the UI can actually show.
      if (request.headers.has("next-action")) {
        return NextResponse.next();
      }

      redirectUrl.searchParams.set(
        "next",
        `${request.nextUrl.pathname}${request.nextUrl.search}`,
      );
      response.headers.set("location", redirectUrl.toString());
    }
  }

  return response;
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/budget/:path*",
    "/bills/:path*",
    "/income/:path*",
    "/spending/:path*",
    "/savings/:path*",
    "/calendar/:path*",
    "/reports/:path*",
    "/settings/:path*",
    "/onboarding/:path*",
  ],
};
