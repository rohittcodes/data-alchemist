import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

const isPublicRoute = createRouteMatcher([
  '/',
  '/sign-in(.*)', 
  '/sign-up(.*)',
  '/api/upload',
  '/api/ai/(.*)'
]);

export default clerkMiddleware(async (auth, req) => {
  const authObj = await auth();
  
  // Redirect logged in users to data page if they're on the home page
  if (authObj.userId && req.nextUrl.pathname === '/') {
    return NextResponse.redirect(new URL('/data', req.url));
  }

  // Redirect old dashboard routes to new structure
  if (req.nextUrl.pathname === '/dashboard') {
    return NextResponse.redirect(new URL('/analysis', req.url));
  }

  // Protect private routes
  if (!isPublicRoute(req) && !authObj.userId) {
    const signInUrl = new URL('/sign-in', req.url);
    signInUrl.searchParams.set('redirect_url', req.url);
    return NextResponse.redirect(signInUrl);
  }
});

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
};
