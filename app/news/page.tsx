"use client";

import { motion } from "framer-motion";
import { NewsGrid } from "@/components/news/news-grid";
import { EtchedBanner } from "@/components/ui/etched-banner";
import { useLocale } from "@/lib/i18n";

export default function NewsPage() {
  const { t } = useLocale();

  return (
    <div className="min-h-screen w-full pt-28 pb-24 px-4 md:px-8 lg:px-10 selection:bg-[var(--surface-hover)]">
      <div className="max-w-7xl mx-auto space-y-10">
        <EtchedBanner
          preset="ash"
          eyebrow={t.news.eyebrow}
          meta={t.news.poweredBy}
          titlePre={t.news.titlePre}
          titleItalic={t.news.titleItalic}
          subtitle={t.news.subtitle}
        />

        {/* News Grid */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
        >
          <NewsGrid />
        </motion.div>
      </div>
    </div>
  );
}
