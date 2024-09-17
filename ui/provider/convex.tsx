"use client";

// import { ClerkProvider } from "@clerk/nextjs";
// import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
// import { ReactNode } from "react";
// import { ConvexProvider, ConvexReactClient } from "convex/react";

// const convex = new ConvexReactClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

// export function ConvexClientProvider({ children }: { children: ReactNode }) {
//   return (
//     <ClerkProvider>
//       <ConvexProvider client={convex}>{children}</ConvexProvider>
//     </ClerkProvider>
//   );
// }

import { ClerkProvider } from "@clerk/nextjs";
import { ReactNode } from "react";
import { ConvexQueryClient } from "@convex-dev/react-query";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ConvexProvider, ConvexReactClient } from "convex/react";

const convex = new ConvexReactClient(process.env.NEXT_PUBLIC_CONVEX_URL!);
const convexQueryClient = new ConvexQueryClient(convex);
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryKeyHashFn: convexQueryClient.hashFn(),
      queryFn: convexQueryClient.queryFn(),
    },
  },
});
convexQueryClient.connect(queryClient);

// ReactDOM.createRoot(document.getElementById("root")!).render(
//   <ConvexProvider client={convex}>
//     <QueryClientProvider client={queryClient}>
//       <App />
//     </QueryClientProvider>
//   </ConvexProvider>
// );

export function ConvexClientProvider({ children }: { children: ReactNode }) {
  return (
    // <ConvexProvider client={convex}>{children}</ConvexProvider>

    <ClerkProvider>
      <ConvexProvider client={convex}>
        <QueryClientProvider client={queryClient}>
          {children}
        </QueryClientProvider>
      </ConvexProvider>
    </ClerkProvider>
  );
}
