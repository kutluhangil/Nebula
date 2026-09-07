/**
 * Curated reference data for the sky widgets.
 *
 * None of this is live and none of it is invented. Every record names the
 * published source it was taken from, and every card that renders one of these
 * records renders that attribution with it. Where a figure has an "as of"
 * quality — moon counts, most obviously — the source string carries the date.
 */

const IAU_SOURCE = "IAU constellation boundaries (Delporte, 1930)";
const NASA_FACT_SHEET =
  "NASA Planetary Fact Sheet (nssdc.gsfc.nasa.gov), moon counts as published 2025";

export interface Constellation {
  name: string;
  abbreviation: string;
  genitive: string;
  brightestStar: string;
  brightestStarMagnitude: number;
  areaSquareDegrees: number;
  /** Month the constellation culminates around local midnight. */
  bestViewedMonth: string;
  /** A well-known deep-sky object inside the constellation's boundary. */
  notableObject: string;
  hemisphere: "northern" | "southern" | "equatorial";
  source: string;
}

export const CONSTELLATIONS: readonly Constellation[] = [
  { name: "Orion", abbreviation: "Ori", genitive: "Orionis", brightestStar: "Rigel", brightestStarMagnitude: 0.13, areaSquareDegrees: 594.12, bestViewedMonth: "January", notableObject: "Orion Nebula (M42)", hemisphere: "equatorial", source: IAU_SOURCE },
  { name: "Canis Major", abbreviation: "CMa", genitive: "Canis Majoris", brightestStar: "Sirius", brightestStarMagnitude: -1.46, areaSquareDegrees: 380.12, bestViewedMonth: "February", notableObject: "Messier 41 (open cluster)", hemisphere: "southern", source: IAU_SOURCE },
  { name: "Gemini", abbreviation: "Gem", genitive: "Geminorum", brightestStar: "Pollux", brightestStarMagnitude: 1.14, areaSquareDegrees: 513.76, bestViewedMonth: "February", notableObject: "Messier 35 (open cluster)", hemisphere: "northern", source: IAU_SOURCE },
  { name: "Carina", abbreviation: "Car", genitive: "Carinae", brightestStar: "Canopus", brightestStarMagnitude: -0.74, areaSquareDegrees: 494.18, bestViewedMonth: "March", notableObject: "Carina Nebula (NGC 3372)", hemisphere: "southern", source: IAU_SOURCE },
  { name: "Ursa Major", abbreviation: "UMa", genitive: "Ursae Majoris", brightestStar: "Alioth", brightestStarMagnitude: 1.77, areaSquareDegrees: 1279.66, bestViewedMonth: "April", notableObject: "Pinwheel Galaxy (M101)", hemisphere: "northern", source: IAU_SOURCE },
  { name: "Leo", abbreviation: "Leo", genitive: "Leonis", brightestStar: "Regulus", brightestStarMagnitude: 1.4, areaSquareDegrees: 946.96, bestViewedMonth: "April", notableObject: "Leo Triplet (M65, M66, NGC 3628)", hemisphere: "equatorial", source: IAU_SOURCE },
  { name: "Hydra", abbreviation: "Hya", genitive: "Hydrae", brightestStar: "Alphard", brightestStarMagnitude: 2.0, areaSquareDegrees: 1302.84, bestViewedMonth: "April", notableObject: "Southern Pinwheel Galaxy (M83)", hemisphere: "equatorial", source: IAU_SOURCE },
  { name: "Virgo", abbreviation: "Vir", genitive: "Virginis", brightestStar: "Spica", brightestStarMagnitude: 0.98, areaSquareDegrees: 1294.43, bestViewedMonth: "May", notableObject: "Sombrero Galaxy (M104)", hemisphere: "equatorial", source: IAU_SOURCE },
  { name: "Centaurus", abbreviation: "Cen", genitive: "Centauri", brightestStar: "Alpha Centauri", brightestStarMagnitude: -0.27, areaSquareDegrees: 1060.42, bestViewedMonth: "May", notableObject: "Omega Centauri (NGC 5139)", hemisphere: "southern", source: IAU_SOURCE },
  { name: "Crux", abbreviation: "Cru", genitive: "Crucis", brightestStar: "Acrux", brightestStarMagnitude: 0.77, areaSquareDegrees: 68.45, bestViewedMonth: "May", notableObject: "Jewel Box cluster (NGC 4755)", hemisphere: "southern", source: IAU_SOURCE },
  { name: "Boötes", abbreviation: "Boo", genitive: "Boötis", brightestStar: "Arcturus", brightestStarMagnitude: -0.05, areaSquareDegrees: 906.83, bestViewedMonth: "June", notableObject: "NGC 5466 (globular cluster)", hemisphere: "northern", source: IAU_SOURCE },
  { name: "Scorpius", abbreviation: "Sco", genitive: "Scorpii", brightestStar: "Antares", brightestStarMagnitude: 1.06, areaSquareDegrees: 496.78, bestViewedMonth: "July", notableObject: "Ptolemy Cluster (M7)", hemisphere: "southern", source: IAU_SOURCE },
  { name: "Lyra", abbreviation: "Lyr", genitive: "Lyrae", brightestStar: "Vega", brightestStarMagnitude: 0.03, areaSquareDegrees: 286.48, bestViewedMonth: "August", notableObject: "Ring Nebula (M57)", hemisphere: "northern", source: IAU_SOURCE },
  { name: "Aquila", abbreviation: "Aql", genitive: "Aquilae", brightestStar: "Altair", brightestStarMagnitude: 0.76, areaSquareDegrees: 652.47, bestViewedMonth: "August", notableObject: "Barnard's E (dark nebula)", hemisphere: "equatorial", source: IAU_SOURCE },
  { name: "Sagittarius", abbreviation: "Sgr", genitive: "Sagittarii", brightestStar: "Kaus Australis", brightestStarMagnitude: 1.85, areaSquareDegrees: 867.43, bestViewedMonth: "August", notableObject: "Lagoon Nebula (M8)", hemisphere: "southern", source: IAU_SOURCE },
  { name: "Cygnus", abbreviation: "Cyg", genitive: "Cygni", brightestStar: "Deneb", brightestStarMagnitude: 1.25, areaSquareDegrees: 803.98, bestViewedMonth: "September", notableObject: "North America Nebula (NGC 7000)", hemisphere: "northern", source: IAU_SOURCE },
  { name: "Andromeda", abbreviation: "And", genitive: "Andromedae", brightestStar: "Alpheratz", brightestStarMagnitude: 2.06, areaSquareDegrees: 722.28, bestViewedMonth: "November", notableObject: "Andromeda Galaxy (M31)", hemisphere: "northern", source: IAU_SOURCE },
  { name: "Cassiopeia", abbreviation: "Cas", genitive: "Cassiopeiae", brightestStar: "Schedar", brightestStarMagnitude: 2.24, areaSquareDegrees: 598.41, bestViewedMonth: "November", notableObject: "Cassiopeia A (supernova remnant)", hemisphere: "northern", source: IAU_SOURCE },
  { name: "Perseus", abbreviation: "Per", genitive: "Persei", brightestStar: "Mirfak", brightestStarMagnitude: 1.79, areaSquareDegrees: 615.0, bestViewedMonth: "December", notableObject: "Double Cluster (NGC 869 and NGC 884)", hemisphere: "northern", source: IAU_SOURCE },
  { name: "Taurus", abbreviation: "Tau", genitive: "Tauri", brightestStar: "Aldebaran", brightestStarMagnitude: 0.85, areaSquareDegrees: 797.25, bestViewedMonth: "January", notableObject: "Crab Nebula (M1)", hemisphere: "northern", source: IAU_SOURCE },
];

export interface Planet {
  name: string;
  diameterKm: number;
  massKg: number;
  /** Length of one solar day, in hours. */
  dayLengthHours: number;
  /** Orbital period, in Earth days. */
  yearLengthDays: number;
  meanTemperatureC: number;
  moons: number;
  distanceFromSunMillionKm: number;
  source: string;
}

export const PLANETS: readonly Planet[] = [
  { name: "Mercury", diameterKm: 4879, massKg: 0.33e24, dayLengthHours: 4222.6, yearLengthDays: 88.0, meanTemperatureC: 167, moons: 0, distanceFromSunMillionKm: 57.9, source: NASA_FACT_SHEET },
  { name: "Venus", diameterKm: 12104, massKg: 4.87e24, dayLengthHours: 2802.0, yearLengthDays: 224.7, meanTemperatureC: 464, moons: 0, distanceFromSunMillionKm: 108.2, source: NASA_FACT_SHEET },
  { name: "Earth", diameterKm: 12756, massKg: 5.97e24, dayLengthHours: 24.0, yearLengthDays: 365.2, meanTemperatureC: 15, moons: 1, distanceFromSunMillionKm: 149.6, source: NASA_FACT_SHEET },
  { name: "Mars", diameterKm: 6792, massKg: 0.642e24, dayLengthHours: 24.7, yearLengthDays: 687.0, meanTemperatureC: -65, moons: 2, distanceFromSunMillionKm: 228.0, source: NASA_FACT_SHEET },
  { name: "Jupiter", diameterKm: 142984, massKg: 1898e24, dayLengthHours: 9.9, yearLengthDays: 4331, meanTemperatureC: -110, moons: 95, distanceFromSunMillionKm: 778.5, source: NASA_FACT_SHEET },
  { name: "Saturn", diameterKm: 120536, massKg: 568e24, dayLengthHours: 10.7, yearLengthDays: 10747, meanTemperatureC: -140, moons: 274, distanceFromSunMillionKm: 1432.0, source: NASA_FACT_SHEET },
  { name: "Uranus", diameterKm: 51118, massKg: 86.8e24, dayLengthHours: 17.2, yearLengthDays: 30589, meanTemperatureC: -195, moons: 28, distanceFromSunMillionKm: 2867.0, source: NASA_FACT_SHEET },
  { name: "Neptune", diameterKm: 49528, massKg: 102e24, dayLengthHours: 16.1, yearLengthDays: 59800, meanTemperatureC: -200, moons: 16, distanceFromSunMillionKm: 4515.0, source: NASA_FACT_SHEET },
];

export interface AstronomyFact {
  text: string;
  source: string;
}

export const ASTRONOMY_FACTS: readonly AstronomyFact[] = [
  { text: "Sunlight takes about 8 minutes and 20 seconds to cross the 150 million kilometres to Earth.", source: "NASA Sun fact sheet" },
  { text: "A day on Venus is longer than its year: it turns once in 243 Earth days and orbits the Sun in 225.", source: "NASA Venus fact sheet" },
  { text: "Olympus Mons on Mars rises about 22 kilometres above the surrounding plains, roughly two and a half times Everest's height above sea level.", source: "NASA Mars exploration programme" },
  { text: "The Milky Way and the Andromeda galaxy are closing at about 110 kilometres per second and will begin to merge in roughly four billion years.", source: "NASA / Hubble Space Telescope, 2012" },
  { text: "Neutron star material is so dense that a sugar-cube-sized piece would weigh about a billion tonnes at Earth's surface.", source: "NASA neutron star overview" },
  { text: "Voyager 1 crossed into interstellar space in August 2012 and remains the most distant human-made object.", source: "NASA JPL, Voyager mission" },
  { text: "The cosmic microwave background is light released about 380,000 years after the Big Bang, when the universe first became transparent.", source: "NASA WMAP mission" },
  { text: "Saturn's mean density is 0.687 grams per cubic centimetre — lower than water's.", source: "NASA Saturn fact sheet" },
  { text: "Neptune takes about 165 Earth years to orbit the Sun; it completed its first full orbit since its 1846 discovery in 2011.", source: "NASA Neptune overview" },
  { text: "The International Space Station circles Earth about 16 times a day.", source: "NASA ISS facts and figures" },
  { text: "Laser ranging off the reflectors Apollo crews left behind shows the Moon receding from Earth by about 3.8 centimetres a year.", source: "NASA Lunar Laser Ranging experiment" },
  { text: "Jupiter's Great Red Spot has been tracked continuously since 1830 and has been shrinking throughout the observations.", source: "NASA / Hubble Space Telescope" },
];

export interface SpaceQuote {
  text: string;
  speaker: string;
  context: string;
}

export const SPACE_QUOTES: readonly SpaceQuote[] = [
  { text: "That's one small step for man, one giant leap for mankind.", speaker: "Neil Armstrong", context: "First step onto the Moon, Apollo 11, 20 July 1969" },
  { text: "Houston, Tranquility Base here. The Eagle has landed.", speaker: "Neil Armstrong", context: "Lunar module touchdown, Apollo 11, 20 July 1969" },
  { text: "The Earth is the cradle of humanity, but mankind cannot stay in the cradle forever.", speaker: "Konstantin Tsiolkovsky", context: "Letter, 1911" },
  { text: "Poyekhali! — Let's go!", speaker: "Yuri Gagarin", context: "At the launch of Vostok 1, 12 April 1961" },
  { text: "We choose to go to the Moon in this decade and do the other things, not because they are easy, but because they are hard.", speaker: "John F. Kennedy", context: "Address at Rice University, 12 September 1962" },
  { text: "Look again at that dot. That's here. That's home. That's us.", speaker: "Carl Sagan", context: "Pale Blue Dot, 1994" },
  { text: "For small creatures such as we the vastness is bearable only through love.", speaker: "Carl Sagan", context: "Contact, 1985" },
  { text: "Space is for everybody. It's not just for a few people in science or math, or for a select group of astronauts.", speaker: "Christa McAuliffe", context: "Teacher in Space Project, 1985" },
  { text: "Once you've been in space, you appreciate how small and fragile the Earth is.", speaker: "Valentina Tereshkova", context: "First woman in space, Vostok 6, 1963" },
  { text: "The stars don't look bigger, but they do look brighter.", speaker: "Sally Ride", context: "On observing from orbit, STS-7, 1983" },
];

/**
 * The record shown for a given UTC day.
 *
 * Indexed by whole days since the Unix epoch rather than by day-of-year, so the
 * rotation does not jump when a list length fails to divide the year evenly.
 * Deterministic on purpose: the server and the client compute the same index,
 * so there is no hydration mismatch, and "of the day" stays true for the whole
 * UTC day. A random pick would change on every render and make the label false.
 */
export function pickForDay<T>(list: readonly T[], date: Date): T {
  if (!list.length) {
    throw new Error("pickForDay was given an empty list");
  }

  const daysSinceEpoch = Math.floor(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()) /
      86_400_000
  );

  return list[daysSinceEpoch % list.length];
}
