"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MotionConfig } from "framer-motion";
import { useState } from "react";

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 1000 * 60 * 5, // 5 minutes
            retry: 2,
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      {/* The CSS media query neutralises CSS transitions, but every entrance in
          this app is a Framer Motion animation driven from JavaScript and is
          unaffected by it. `reducedMotion="user"` makes those honour the same
          preference: transforms are dropped, opacity still resolves, so a
          reduced-motion visitor sees the content rather than a blank section. */}
      <MotionConfig reducedMotion="user">{children}</MotionConfig>
    </QueryClientProvider>
  );
}
