import { event } from "./builders";
import type { MotorsportEvent } from "../types";

const E = event;

const gtwcEuropeRows = [
  ["paul-ricard", "Circuit Paul Ricard", "2026-04-11", "2026-04-12", "Endurance Cup"],
  ["brands-hatch", "Brands Hatch", "2026-05-02", "2026-05-03", "Sprint Cup"],
  ["monza", "Monza", "2026-05-30", "2026-05-31", "Endurance Cup"],
  ["misano", "Misano", "2026-07-18", "2026-07-19", "Sprint Cup"],
  ["magny-cours", "Magny-Cours", "2026-08-01", "2026-08-02", "Sprint Cup"],
  ["nurburgring", "Nürburgring", "2026-08-29", "2026-08-30", "Endurance Cup"],
  ["zandvoort", "Zandvoort", "2026-09-19", "2026-09-20", "Sprint Cup"],
  ["barcelona", "Barcelona", "2026-10-03", "2026-10-04", "Endurance Cup"],
  ["portimao", "Portimao", "2026-10-17", "2026-10-18", "Sprint Cup"],
] as const;
const gtwcEuropeEvents = gtwcEuropeRows.map(([circuitId, name, startDate, endDate, raceType]) => E({ championshipId: "gtwce", id: `2026-gtwce-${circuitId}`, name, circuitId, startDate, endDate, duration: raceType === "Endurance Cup" ? "Endurance" : "2 races", raceType }));

const spa24 = E({
  championshipId: "gtwce",
  id: "2026-spa-24-hours",
  name: "24 Hours of Spa",
  circuitId: "spa",
  startDate: "2026-06-25",
  endDate: "2026-06-28",
  duration: "24h",
  raceType: "GT3 Endurance",
  relatedChampionshipIds: ["igtc"],
});

const gtwcAmericaRows = [
  ["sonoma", "Sonoma Raceway", "2026-03-27", "2026-03-29"], ["cota", "Circuit of the Americas", "2026-04-24", "2026-04-26"],
  ["sebring", "Sebring International Raceway", "2026-05-08", "2026-05-10"], ["road-atlanta", "Michelin Raceway Road Atlanta", "2026-06-12", "2026-06-14"],
  ["road-america", "Road America", "2026-08-28", "2026-08-30"], ["barber", "Barber Motorsports Park", "2026-09-25", "2026-09-27"],
  ["indianapolis", "Indianapolis 8 Hour", "2026-10-08", "2026-10-10"],
] as const;
const gtwcAmericaEvents = gtwcAmericaRows.map(([circuitId, name, startDate, endDate], index) => E({ championshipId: "gtwca", id: `2026-gtwca-${circuitId}`, name, circuitId, startDate, endDate, duration: index === 6 ? "8h" : "3h", raceType: "GT3", relatedChampionshipIds: index === 6 ? ["igtc"] : undefined }));

const gtwcAsiaRows = [
  ["sepang", "Sepang", "2026-04-03", "2026-04-05"], ["mandalika", "Mandalika", "2026-05-01", "2026-05-03"],
  ["fuji", "Fuji SRO GT PowerTour", "2026-07-09", "2026-07-12"], ["okayama", "Okayama SRO GT PowerTour", "2026-08-27", "2026-08-30"],
  ["beijing", "Beijing Street Circuit", "2026-10-02", "2026-10-04"], ["shanghai", "Shanghai", "2026-10-30", "2026-11-01"],
] as const;
const gtwcAsiaEvents = gtwcAsiaRows.map(([circuitId, name, startDate, endDate]) => E({ championshipId: "gtwcas", id: `2026-gtwcas-${circuitId}`, name, circuitId, startDate, endDate, duration: "2 races", raceType: "GT3" }));

const gtwcAustraliaRows = [
  ["phillip-island", "GT Festival Phillip Island", "2026-03-27", "2026-03-29"], ["the-bend", "GT Festival The Bend", "2026-05-08", "2026-05-10"],
  ["queensland", "GT Festival Queensland", "2026-06-12", "2026-06-14"], ["hidden-valley", "GT Festival Darwin", "2026-07-24", "2026-07-26"],
  ["sydney", "GT Festival Sydney", "2026-09-18", "2026-09-20"], ["adelaide", "Adelaide Grand Final", "2026-11-26", "2026-11-29"],
] as const;
const gtwcAustraliaEvents = gtwcAustraliaRows.map(([circuitId, name, startDate, endDate]) => E({ championshipId: "gtwcau", id: `2026-gtwcau-${circuitId}`, name, circuitId, startDate, endDate, duration: "2 races", raceType: "GT3" }));

const igtcEvents = [
  E({ championshipId: "igtc", id: "2026-bathurst-12-hour", name: "Bathurst 12 Hour", circuitId: "mount-panorama", startDate: "2026-02-11", endDate: "2026-02-15", duration: "12h", raceType: "GT3 Endurance" }),
  E({ championshipId: "igtc", id: "2026-suzuka-1000km", name: "Suzuka 1000 km", circuitId: "suzuka", startDate: "2026-09-11", endDate: "2026-09-13", duration: "1000 km", raceType: "GT3 Endurance" }),
];

const dtmRows = [
  ["red-bull-ring", "Red Bull Ring", "2026-04-24", "2026-04-26"], ["zandvoort", "Circuit Zandvoort", "2026-05-22", "2026-05-24"],
  ["lausitzring", "DEKRA Lausitzring", "2026-06-19", "2026-06-21"], ["norisring", "Norisring", "2026-07-03", "2026-07-05"],
  ["oschersleben", "Motorsport Arena Oschersleben", "2026-07-24", "2026-07-26"], ["nurburgring", "Nürburgring", "2026-08-14", "2026-08-16"],
  ["sachsenring", "Sachsenring", "2026-09-11", "2026-09-13"], ["hockenheim", "Hockenheimring Finale", "2026-10-09", "2026-10-11"],
] as const;
const dtmEvents = dtmRows.map(([circuitId, name, startDate, endDate]) => E({ championshipId: "dtm", id: `2026-dtm-${circuitId}`, name, circuitId, startDate, endDate, duration: "2 races", raceType: "GT3 Sprint" }));

const britishGtRows = [
  ["silverstone", "Silverstone 500", "2026-04-24", "2026-04-26", "3h"], ["oulton-park", "Oulton Park", "2026-05-22", "2026-05-25", "2 races"],
  ["spa", "Spa-Francorchamps", "2026-06-19", "2026-06-21", "Race"], ["snetterton", "Snetterton 300", "2026-08-15", "2026-08-16", "2 races"],
  ["donington", "Donington Park", "2026-09-05", "2026-09-06", "Race"], ["brands-hatch", "Brands Hatch", "2026-09-26", "2026-09-27", "Race"],
] as const;
const britishGtEvents = britishGtRows.map(([circuitId, name, startDate, endDate, duration]) => E({ championshipId: "britgt", id: `2026-britgt-${circuitId}`, name, circuitId, startDate, endDate, duration, raceType: "GT3 · GT4" }));

const gtOpenRows = [
  ["portimao", "Portimao", "2026-04-17", "2026-04-19"], ["spa", "Spa-Francorchamps 500 km", "2026-05-15", "2026-05-17"],
  ["misano", "Misano", "2026-06-05", "2026-06-07"], ["hungaroring", "Hungaroring", "2026-07-03", "2026-07-05"],
  ["paul-ricard", "Paul Ricard", "2026-07-17", "2026-07-19"], ["hockenheim", "Hockenheimring", "2026-09-11", "2026-09-13"],
  ["monza", "Monza 500 km", "2026-09-25", "2026-09-27"], ["barcelona", "Barcelona Finale", "2026-10-23", "2026-10-25"],
] as const;
const gtOpenEvents = gtOpenRows.map(([circuitId, name, startDate, endDate]) => E({ championshipId: "gtopen", id: `2026-gtopen-${circuitId}`, name, circuitId, startDate, endDate, duration: name.includes("500") ? "500 km" : "2 races", raceType: "GT3" }));

const motoRows = [
  ["thailand", "Thai Grand Prix", "buriram", "2026-02-27", "2026-03-01"], ["brazil", "Brazilian Grand Prix", "goiania", "2026-03-20", "2026-03-22"],
  ["americas", "Grand Prix of the Americas", "cota", "2026-03-27", "2026-03-29"], ["spain", "Spanish Grand Prix", "jerez", "2026-04-24", "2026-04-26"],
  ["france", "French Grand Prix", "le-mans-bugatti", "2026-05-08", "2026-05-10"], ["catalonia", "Catalan Grand Prix", "barcelona", "2026-05-15", "2026-05-17"],
  ["italy", "Italian Grand Prix", "mugello", "2026-05-29", "2026-05-31"], ["hungary", "Hungarian Grand Prix", "balaton", "2026-06-05", "2026-06-07"],
  ["czechia", "Czech Grand Prix", "brno", "2026-06-19", "2026-06-21"], ["netherlands", "Dutch TT", "assen", "2026-06-26", "2026-06-28"],
  ["germany", "German Grand Prix", "sachsenring", "2026-07-10", "2026-07-12"], ["great-britain", "British Grand Prix", "silverstone", "2026-08-07", "2026-08-09"],
  ["aragon", "Aragon Grand Prix", "motorland", "2026-08-28", "2026-08-30"], ["san-marino", "San Marino Grand Prix", "misano", "2026-09-11", "2026-09-13"],
  ["austria", "Austrian Grand Prix", "red-bull-ring", "2026-09-18", "2026-09-20"], ["japan", "Japanese Grand Prix", "motegi", "2026-10-02", "2026-10-04"],
  ["indonesia", "Indonesian Grand Prix", "mandalika", "2026-10-09", "2026-10-11"], ["australia", "Australian Grand Prix", "phillip-island", "2026-10-23", "2026-10-25"],
  ["malaysia", "Malaysian Grand Prix", "sepang", "2026-10-30", "2026-11-01"], ["qatar", "Qatar Grand Prix", "lusail", "2026-11-06", "2026-11-08"],
  ["portugal", "Portuguese Grand Prix", "portimao", "2026-11-20", "2026-11-22"], ["valencia", "Valencian Grand Prix", "valencia", "2026-11-27", "2026-11-29"],
] as const;
const motoEvents = (["motogp", "moto2", "moto3"] as const).flatMap((championshipId) => motoRows.map(([suffix, name, circuitId, startDate, endDate]) => E({ championshipId, id: `2026-${championshipId}-${suffix}`, name, circuitId, startDate, endDate, duration: championshipId === "motogp" ? "Sprint + Grand Prix" : "Grand Prix", raceType: championshipId.toUpperCase() })));

const worldSbkRows = [
  ["phillip-island", "Australian Round", "2026-02-20", "2026-02-22"], ["portimao", "Portuguese Round", "2026-03-27", "2026-03-29"],
  ["assen", "Dutch Round", "2026-04-17", "2026-04-19"], ["balaton", "Hungarian Round", "2026-05-01", "2026-05-03"],
  ["most", "Czech Round", "2026-05-15", "2026-05-17"], ["motorland", "Aragon Round", "2026-05-29", "2026-05-31"],
  ["misano", "Emilia-Romagna Round", "2026-06-12", "2026-06-14"], ["donington", "UK Round", "2026-07-10", "2026-07-12"],
  ["magny-cours", "French Round", "2026-09-04", "2026-09-06"], ["cremona", "Cremona Round", "2026-09-25", "2026-09-27"],
  ["estoril", "Estoril Round", "2026-10-09", "2026-10-11"], ["jerez", "Spanish Round", "2026-10-16", "2026-10-18"],
] as const;
const worldSbkEvents = worldSbkRows.map(([circuitId, name, startDate, endDate]) => E({ championshipId: "wsbk", id: `2026-wsbk-${circuitId}`, name, circuitId, startDate, endDate, duration: "3 races", raceType: "Superbike" }));

const wrcRows = [
  ["monte-carlo-rally", "Rallye Monte-Carlo", "2026-01-25"], ["umea", "Rally Sweden", "2026-02-15"],
  ["naivasha", "Safari Rally Kenya", "2026-03-15"], ["zagreb", "Croatia Rally", "2026-04-12"],
  ["canary-islands", "Rally Islas Canarias", "2026-04-26"], ["matosinhos", "Rally de Portugal", "2026-05-10"],
  ["aichi", "Rally Japan", "2026-05-31"], ["lamia", "Acropolis Rally Greece", "2026-06-28"],
  ["tartu", "Rally Estonia", "2026-07-19"], ["jyvaskyla", "Rally Finland", "2026-08-02"],
  ["encarnacion", "Rally del Paraguay", "2026-08-30"], ["concepcion", "Rally Chile Bio Bio", "2026-09-13"],
  ["sardinia", "Rally Italia Sardegna", "2026-10-04"], ["jeddah-rally", "Rally Saudi Arabia", "2026-11-15"],
] as const;
const wrcEvents = wrcRows.map(([circuitId, name, date]) => E({ championshipId: "wrc", id: `2026-wrc-${circuitId}`, name, circuitId, startDate: date, duration: "Rally", raceType: "Rally" }));

const rallycrossRows = [
  ["bikernieki", "Euro RX of Latvia", "2026-05-09", "2026-05-10"], ["nyirad", "Euro RX of Hungary", "2026-05-30", "2026-05-31"],
  ["holjes", "Euro RX of Sweden", "2026-07-04", "2026-07-05"], ["mondello", "Euro RX of Ireland", "2026-07-18", "2026-07-19"],
  ["loheac", "Euro RX of France", "2026-08-29", "2026-08-30"], ["lousada", "Euro RX of Portugal", "2026-09-12", "2026-09-13"],
  ["jakarta", "FIA Rallycross World Cup", "2026-12-05", "2026-12-06"],
] as const;
const rallycrossEvents = rallycrossRows.map(([circuitId, name, startDate, endDate]) => E({ championshipId: "wrx", id: `2026-rx-${circuitId}`, name, circuitId, startDate, endDate, duration: "Rallycross", raceType: name.includes("World Cup") ? "World Cup" : "Euro RX" }));

const dakarEvents = [E({ championshipId: "dakar", id: "2026-dakar-rally", name: "Dakar Rally", circuitId: "saudi-arabia", startDate: "2026-01-02", endDate: "2026-01-17", duration: "16 days", raceType: "Rally-raid", sourceUrl: "https://www.fia.com/news/2026-fia-sporting-calendars-approved-world-motor-sport-council" })];

export const gtMotoRallyEvents: MotorsportEvent[] = [
  ...gtwcEuropeEvents, spa24, ...gtwcAmericaEvents, ...gtwcAsiaEvents, ...gtwcAustraliaEvents,
  ...igtcEvents, ...dtmEvents, ...britishGtEvents, ...gtOpenEvents, ...motoEvents,
  ...worldSbkEvents, ...wrcEvents, ...rallycrossEvents, ...dakarEvents,
];
