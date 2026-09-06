"use client";

import { useInfiniteQuery } from "@tanstack/react-query";
import { Loader2, Newspaper } from "lucide-react";
import { NewsCard, SpaceflightArticle } from "./news-card";
import { useEffect } from "react";
import { useInView } from "react-intersection-observer";
import { fetchJson } from "@/lib/api-client";

interface NewsResponse {
  count: number;
  /** Offset for the next page, or null on the last one. */
  nextOffset: number | null;
  results: SpaceflightArticle[];
}

export function NewsGrid() {
  const { ref, inView } = useInView();

  const {
    data,
    error,
    refetch,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    status,
  } = useInfiniteQuery({
    queryKey: ["space-news"],
    // Read through this app's own route rather than calling the upstream from
    // the browser, so news gets the same timeout, error shape and health probe
    // as every other source.
    queryFn: ({ pageParam }) =>
      fetchJson<NewsResponse>(`/api/news?offset=${pageParam}`),
    initialPageParam: 0,
    getNextPageParam: (lastPage) => lastPage.nextOffset,
  });

  useEffect(() => {
    if (inView && hasNextPage) {
      fetchNextPage();
    }
  }, [inView, hasNextPage, fetchNextPage]);

  if (status === "pending") {
    return (
      <div className="w-full flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 text-[var(--text-faint)] animate-spin" />
      </div>
    );
  }

  if (status === "error") {
    return (
      <div className="glass-panel p-8 flex flex-col items-center justify-center gap-3 text-center">
        <Newspaper className="w-5 h-5 text-[var(--text-faint)]" />
        <p className="text-[var(--text-dim)] text-sm">
          Space news is unavailable right now.
        </p>
        <p className="text-[var(--text-faint)] text-xs max-w-md">
          {error instanceof Error ? error.message : "Unknown error"}
        </p>
        <button
          onClick={() => refetch()}
          className="px-3 py-1.5 rounded-lg bg-[var(--surface)] border border-[var(--border)] text-[var(--text-dim)] text-xs font-medium hover:text-[var(--text)] transition-colors"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-12">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {data.pages.map((page) => (
          page.results.map((article, j) => (
            <NewsCard 
              key={article.id} 
              article={article} 
              index={j % 12} 
            />
          ))
        ))}
      </div>

      <div 
        ref={ref} 
        className="flex items-center justify-center py-8"
      >
        {isFetchingNextPage ? (
          <Loader2 className="w-5 h-5 text-[var(--text-faint)] animate-spin" />
        ) : hasNextPage ? (
          <span className="text-sm text-[var(--text-faint)]">Scroll for more</span>
        ) : (
          <span className="text-sm text-[var(--text-faint)]">You have reached the end</span>
        )}
      </div>
    </div>
  );
}
