import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse, type NextRequest, type NextFetchEvent } from "next/server";

const isPublicRoute = createRouteMatcher([
  "/",
  "/login(.*)",
  "/register(.*)",
  "/api/v1(.*)",
  "/api(.*)",
]);

export default function middleware(request: NextRequest, event: NextFetchEvent) {
  const publishableKey =
    process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY || process.env.CLERK_PUBLISHABLE_KEY;

  // When Clerk publishable key is not configured, pass through gracefully
  if (!publishableKey) {
    return NextResponse.next();
  }

  return clerkMiddleware(
    async (auth, req) => {
      if (!isPublicRoute(req)) {
        const { userId } = await auth();
        if (!userId) {
          const loginUrl = new URL("/login", req.url);
          loginUrl.searchParams.set("redirect_url", req.nextUrl.pathname);
          return NextResponse.redirect(loginUrl);
        }
      }
    },
    { publishableKey }
  )(request, event);
}

export const config = {
  matcher: [
    // Skip Next.js internals and all static files
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // Always run for API routes
    "/(api|trpc)(.*)",
  ],
};
