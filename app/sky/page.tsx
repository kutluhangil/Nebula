"use client";

import { motion } from "framer-motion";
import { MoonPhaseCard } from "@/components/sky/moon-phase-card";
import { EarthRotationCard } from "@/components/sky/earth-rotation-card";
import { MarsWeatherCard } from "@/components/sky/mars-weather-card";
import { MarsRoversCard } from "@/components/sky/mars-rovers-card";
import { ConstellationCard } from "@/components/sky/constellation-card";
import { PlanetCard } from "@/components/sky/planet-card";
import { AstronomyFactCard } from "@/components/sky/astronomy-fact-card";
import { SpaceQuoteCard } from "@/components/sky/space-quote-card";
import { EtchedBanner } from "@/components/ui/etched-banner";
import { useLocale } from "@/lib/i18n";

export default function SkyPage() {
  const { t } = useLocale();

  const sections = [
    {
      id: "computed",
      heading: t.sky.sections.computed,
      caption: t.sky.sections.computedCap,
      cards: [<MoonPhaseCard key="moon" />, <EarthRotationCard key="rotation" />],
      columns: "lg:grid-cols-2",
    },
    {
      id: "daily",
      heading: t.sky.sections.daily,
      caption: t.sky.sections.dailyCap,
      cards: [
        <ConstellationCard key="constellation" />,
        <PlanetCard key="planet" />,
      ],
      columns: "lg:grid-cols-2",
    },
    {
      id: "mars-live",
      heading: t.sky.sections.marsLive,
      caption: t.sky.sections.marsLiveCap,
      cards: [<MarsRoversCard key="rovers" />],
      columns: "lg:grid-cols-1",
    },
    {
      id: "archive",
      heading: t.sky.sections.archive,
      caption: t.sky.sections.archiveCap,
      cards: [<MarsWeatherCard key="mars" />],
      columns: "lg:grid-cols-1",
    },
  ];

  return (
    <div className="min-h-screen w-full pt-28 pb-24 px-4 md:px-8 lg:px-10">
      <div className="max-w-7xl mx-auto space-y-10 md:space-y-14">
        <EtchedBanner
          preset="orchid"
          eyebrow={t.sky.badge}
          titlePre={t.sky.titlePre}
          titleItalic={t.sky.titleItalic}
          subtitle={t.sky.subtitle}
        />

        {sections.map((section, sectionIndex) => (
          <motion.section
            key={section.id}
            aria-labelledby={`${section.id}-heading`}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              duration: 0.7,
              delay: 0.08 + sectionIndex * 0.08,
              ease: [0.16, 1, 0.3, 1],
            }}
            className="space-y-5"
          >
            <div className="panel-head px-1">
              <h2
                id={`${section.id}-heading`}
                className="panel-title font-serif text-lg"
              >
                {section.heading}
              </h2>
              <span className="eyebrow">{section.caption}</span>
            </div>
            <div
              className={`grid grid-cols-1 ${section.columns} gap-6 items-stretch`}
            >
              {section.cards}
            </div>
          </motion.section>
        ))}

        <motion.section
          aria-labelledby="reading-heading"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.35, ease: [0.16, 1, 0.3, 1] }}
          className="space-y-5"
        >
          <div className="panel-head px-1">
            <h2 id="reading-heading" className="panel-title font-serif text-lg">
              {t.sky.sections.reading}
            </h2>
            <span className="eyebrow">{t.sky.sections.readingCap}</span>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
            <AstronomyFactCard />
            <SpaceQuoteCard />
          </div>
        </motion.section>
      </div>
    </div>
  );
}
