import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

let NODE_ENV = process.env.NODE_ENV;

// Define routes that should be protected
const isProtectedRoute = createRouteMatcher([
  // "/api/env(.*)", // Add any additional routes here
  "/trpc", // Add any additional routes here
  "/console", // Add any additional routes here
]);

export default clerkMiddleware((auth, req) => {
  if (isProtectedRoute(req) && NODE_ENV === "production") {
    // if (isProtectedRoute(req)) {
    auth().protect(); // Protect the route if it matches the defined criteria
  }
});

// export const config = {
//   matcher: [
//     // Skip Next.js internals and all static files, unless found in search params
//     "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
//     // Always run for API routes
//     "/(api|trpc)(.*)",
//   ],
// };
