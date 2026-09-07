"use client";

import { motion } from "framer-motion";
import { MoonPhaseCard } from "@/components/sky/moon-phase-card";
import { EarthRotationCard } from "@/components/sky/earth-rotation-card";
import { MarsWeatherCard } from "@/components/sky/mars-weather-card";
import { ConstellationCard } from "@/components/sky/constellation-card";
import { PlanetCard } from "@/components/sky/planet-card";
import { AstronomyFactCard } from "@/components/sky/astronomy-fact-card";
import { SpaceQuoteCard } from "@/components/sky/space-quote-card";

/**
 * The almanac page.
 *
 * Three kinds of content sit here and each card says which it is: values
 * computed from the clock, records curated from a named publication, and one
 * closed archive. They are grouped in that order so the reader meets the live
 * ones first and never has to guess what a number is.
 */
const SECTIONS = [
  {
    id: "computed",
    heading: "Computed now",
    caption: "Derived from the current time and published constants",
    cards: [<MoonPhaseCard key="moon" />, <EarthRotationCard key="rotation" />],
    columns: "lg:grid-cols-2",
  },
  {
    id: "daily",
    heading: "Today's entry",
    caption: "One record a day, drawn from published reference data",
    cards: [
      <ConstellationCard key="constellation" />,
      <PlanetCard key="planet" />,
    ],
    columns: "lg:grid-cols-2",
  },
  {
    id: "archive",
    heading: "From the archive",
    caption: "A closed mission's last transmissions, dated on the card",
    cards: [<MarsWeatherCard key="mars" />],
    // One card, so it takes the full width rather than leaving half the row empty.
    columns: "lg:grid-cols-1",
  },
];

export default function SkyPage() {
  return (
    <div className="min-h-screen w-full pt-28 pb-24 px-4 md:px-8 lg:px-10">
      <div className="max-w-7xl mx-auto space-y-10 md:space-y-14">
        <motion.header
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        >
          <div className="eyebrow-pill mb-3">Almanac</div>
          <h1 className="display-1 text-[var(--text)]">
            Sky <span className="italic text-[var(--text-dim)]">Almanac</span>
          </h1>
          <p className="text-[var(--text-dim)] text-sm mt-3 max-w-2xl leading-relaxed">
            Every card names where its numbers came from and whether they were
            computed, curated or archived. Nothing here is estimated to fill a
            gap.
          </p>
        </motion.header>

        {SECTIONS.map((section, sectionIndex) => (
          <motion.section
            key={section.id}
            aria-labelledby={`${section.id}-heading`}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              duration: 0.8,
              delay: 0.1 + sectionIndex * 0.1,
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
          transition={{ duration: 0.8, delay: 0.4, ease: [0.16, 1, 0.3, 1] }}
          className="space-y-5"
        >
          <div className="panel-head px-1">
            <h2 id="reading-heading" className="panel-title font-serif text-lg">
              Worth knowing
            </h2>
            <span className="eyebrow">Sourced, one a day</span>
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
