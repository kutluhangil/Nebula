"use client";

import { useInfiniteQuery } from "@tanstack/react-query";
import { Loader2, Newspaper, Search, X } from "lucide-react";
import { NewsCard, SpaceflightArticle } from "./news-card";
import { useEffect, useMemo, useState } from "react";
import { useInView } from "react-intersection-observer";
import { fetchJson } from "@/lib/api-client";
import { FeedError } from "@/components/ui/feed-state";
import { useLocale } from "@/lib/i18n";

interface NewsResponse {
  count: number;
  nextOffset: number | null;
  results: SpaceflightArticle[];
}

export function NewsGrid() {
  const { t } = useLocale();
  const { ref, inView } = useInView();
  const [filterText, setFilterText] = useState("");

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
    queryFn: ({ pageParam }) =>
      fetchJson<NewsResponse>(`/api/news?offset=${pageParam}`),
    initialPageParam: 0,
    getNextPageParam: (lastPage) => lastPage.nextOffset,
  });

  useEffect(() => {
    if (inView && hasNextPage && !filterText.trim()) {
      fetchNextPage();
    }
  }, [inView, hasNextPage, fetchNextPage, filterText]);

  const articles = useMemo(() => {
    const all = data?.pages.flatMap((p) => p.results) ?? [];
    const q = filterText.trim().toLowerCase();
    if (!q) return all;
    return all.filter(
      (a) =>
        a.title.toLowerCase().includes(q) ||
        a.news_site.toLowerCase().includes(q) ||
        a.summary.toLowerCase().includes(q)
    );
  }, [data, filterText]);

  if (status === "pending") {
    return (
      <div className="w-full flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 text-[var(--text-faint)] animate-spin" />
      </div>
    );
  }

  if (status === "error") {
    return (
      <div className="glass-panel flex items-center justify-center">
        <FeedError
          title={t.news.unavailable}
          error={error}
          icon={Newspaper}
          onRetry={() => refetch()}
        />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Filter bar */}
      <div className="relative max-w-md">
        <Search
          className="w-4 h-4 text-[var(--text-faint)] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
          aria-hidden="true"
        />
        <input
          type="search"
          value={filterText}
          onChange={(e) => setFilterText(e.target.value)}
          placeholder={t.news.filterPlaceholder}
          aria-label={t.news.filterPlaceholder}
          className="w-full pl-10 pr-9 py-2.5 rounded-xl bg-[var(--surface-1)] border border-[var(--border)] text-sm text-[var(--text)] placeholder:text-[var(--text-faint)] focus:outline-none focus:border-[var(--accent)] transition-colors"
        />
        {filterText && (
          <button
            type="button"
            onClick={() => setFilterText("")}
            aria-label={t.common.close}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-faint)] hover:text-[var(--text)] cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {articles.map((article, j) => (
          <NewsCard key={article.id} article={article} index={j % 12} />
        ))}
      </div>

      <div ref={ref} className="flex items-center justify-center py-8">
        {isFetchingNextPage ? (
          <Loader2 className="w-5 h-5 text-[var(--text-faint)] animate-spin" />
        ) : filterText.trim() ? null : hasNextPage ? (
          <span className="text-sm text-[var(--text-faint)] font-mono">
            {t.news.scrollMore}
          </span>
        ) : (
          <span className="text-sm text-[var(--text-faint)] font-mono">
            {t.news.end}
          </span>
        )}
      </div>
    </div>
  );
}
