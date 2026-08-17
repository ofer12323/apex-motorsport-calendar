import { event, easternToUtc, session } from "./builders";
import type { MotorsportEvent } from "../types";

const E = event;

const f1Rows = [
  ["australian-grand-prix", "Australian Grand Prix", "melbourne", "2026-03-06", "2026-03-08", "2026-03-08T04:00:00Z"],
  ["chinese-grand-prix", "Chinese Grand Prix", "shanghai", "2026-03-13", "2026-03-15", "2026-03-15T07:00:00Z"],
  ["japanese-grand-prix", "Japanese Grand Prix", "suzuka", "2026-03-27", "2026-03-29", "2026-03-29T05:00:00Z"],
  ["miami-grand-prix", "Miami Grand Prix", "miami", "2026-05-01", "2026-05-03", "2026-05-03T20:00:00Z"],
  ["canadian-grand-prix", "Canadian Grand Prix", "montreal", "2026-05-22", "2026-05-24", "2026-05-24T20:00:00Z"],
  ["monaco-grand-prix", "Monaco Grand Prix", "monaco", "2026-06-05", "2026-06-07", "2026-06-07T13:00:00Z"],
  ["barcelona-grand-prix", "Barcelona-Catalunya Grand Prix", "barcelona", "2026-06-12", "2026-06-14", "2026-06-14T13:00:00Z"],
  ["austrian-grand-prix", "Austrian Grand Prix", "red-bull-ring", "2026-06-26", "2026-06-28", "2026-06-28T13:00:00Z"],
  ["british-grand-prix", "British Grand Prix", "silverstone", "2026-07-03", "2026-07-05", "2026-07-05T14:00:00Z"],
  ["belgian-grand-prix", "Belgian Grand Prix", "spa", "2026-07-17", "2026-07-19", "2026-07-19T13:00:00Z"],
  ["hungarian-grand-prix", "Hungarian Grand Prix", "hungaroring", "2026-07-24", "2026-07-26", "2026-07-26T13:00:00Z"],
  ["dutch-grand-prix", "Dutch Grand Prix", "zandvoort", "2026-08-21", "2026-08-23", "2026-08-23T13:00:00Z"],
  ["italian-grand-prix", "Italian Grand Prix", "monza", "2026-09-04", "2026-09-06", "2026-09-06T13:00:00Z"],
  ["madrid-grand-prix", "Spanish Grand Prix - Madrid", "madrid", "2026-09-11", "2026-09-13", "2026-09-13T13:00:00Z"],
  ["azerbaijan-grand-prix", "Azerbaijan Grand Prix", "baku", "2026-09-24", "2026-09-26", "2026-09-26T11:00:00Z"],
  ["singapore-grand-prix", "Singapore Grand Prix", "singapore", "2026-10-09", "2026-10-11", "2026-10-11T12:00:00Z"],
  ["united-states-grand-prix", "United States Grand Prix", "cota", "2026-10-23", "2026-10-25", "2026-10-25T20:00:00Z"],
  ["mexico-city-grand-prix", "Mexico City Grand Prix", "mexico-city", "2026-10-30", "2026-11-01", "2026-11-01T20:00:00Z"],
  ["sao-paulo-grand-prix", "Sao Paulo Grand Prix", "interlagos", "2026-11-06", "2026-11-08", "2026-11-08T17:00:00Z"],
  ["las-vegas-grand-prix", "Las Vegas Grand Prix", "las-vegas", "2026-11-19", "2026-11-21", "2026-11-22T04:00:00Z"],
  ["qatar-grand-prix", "Qatar Grand Prix", "lusail", "2026-11-27", "2026-11-29", "2026-11-29T16:00:00Z"],
  ["abu-dhabi-grand-prix", "Abu Dhabi Grand Prix", "yas-marina", "2026-12-04", "2026-12-06", "2026-12-06T13:00:00Z"],
] as const;

// Session times below are UTC and come from the official Formula 1 weekend
// timetables. Only published sessions are included; an absent entry remains
// visibly unpublished in the UI rather than being estimated.
const f1QualifyingSessions: Record<string, readonly (readonly [string, string])[]> = {
  "dutch-grand-prix": [
    ["Sprint Qualifying", "2026-08-21T14:30:00Z"],
    ["Qualifying", "2026-08-22T14:00:00Z"],
  ],
  "italian-grand-prix": [["Qualifying", "2026-09-05T14:00:00Z"]],
  "madrid-grand-prix": [["Qualifying", "2026-09-12T14:00:00Z"]],
  "azerbaijan-grand-prix": [["Qualifying", "2026-09-25T12:00:00Z"]],
  "singapore-grand-prix": [
    ["Sprint Qualifying", "2026-10-09T12:30:00Z"],
    ["Qualifying", "2026-10-10T13:00:00Z"],
  ],
  "united-states-grand-prix": [["Qualifying", "2026-10-24T21:00:00Z"]],
  "mexico-city-grand-prix": [["Qualifying", "2026-10-31T21:00:00Z"]],
  "sao-paulo-grand-prix": [["Qualifying", "2026-11-07T18:00:00Z"]],
  "las-vegas-grand-prix": [["Qualifying", "2026-11-21T04:00:00Z"]],
  "qatar-grand-prix": [["Qualifying", "2026-11-28T18:00:00Z"]],
  "abu-dhabi-grand-prix": [["Qualifying", "2026-12-05T14:00:00Z"]],
};

const f1Events = f1Rows.map(([id, name, circuitId, startDate, endDate, raceTime]) =>
  E({
    championshipId: "f1",
    id: `2026-${id}`,
    name,
    circuitId,
    startDate,
    endDate,
    duration: "Grand Prix",
    raceType: "Formula",
    sessions: [
      ...(f1QualifyingSessions[id] ?? []).map(([sessionName, startTime]) =>
        session(`2026-${id}`, sessionName, "qualifying", startTime),
      ),
      session(`2026-${id}`, "Race", "race", raceTime),
    ],
  }),
);

// The current official F1 calendar lists this replacement round without a
// confirmed session timetable, so it remains date-only instead of guessing.
f1Events.splice(15, 0, E({
  championshipId: "f1",
  id: "2026-bahrain-grand-prix-malaysia",
  name: "Bahrain Grand Prix in Malaysia",
  circuitId: "sepang",
  startDate: "2026-10-02",
  endDate: "2026-10-04",
  duration: "Grand Prix",
  raceType: "Formula",
  sourceUrl: "https://www.formula1.com/en/racing/2026",
  sessions: [
    session("2026-bahrain-grand-prix-malaysia", "Qualifying", "qualifying", "2026-10-03T08:00:00Z"),
    session("2026-bahrain-grand-prix-malaysia", "Race", "race", "2026-10-04T07:00:00Z"),
  ],
}));

const supportRows = {
  f2: [
    ["melbourne", "2026-03-06", "2026-03-08"], ["monaco", "2026-06-04", "2026-06-07"],
    ["barcelona", "2026-06-12", "2026-06-14"], ["red-bull-ring", "2026-06-26", "2026-06-28"],
    ["silverstone", "2026-07-03", "2026-07-05"], ["spa", "2026-07-17", "2026-07-19"],
    ["hungaroring", "2026-07-24", "2026-07-26"], ["monza", "2026-09-04", "2026-09-06"],
    ["madrid", "2026-09-11", "2026-09-13"], ["baku", "2026-09-24", "2026-09-26"],
    ["lusail", "2026-11-27", "2026-11-29"], ["yas-marina", "2026-12-04", "2026-12-06"],
  ],
  f3: [
    ["melbourne", "2026-03-06", "2026-03-08"], ["monaco", "2026-06-04", "2026-06-07"],
    ["barcelona", "2026-06-12", "2026-06-14"], ["red-bull-ring", "2026-06-26", "2026-06-28"],
    ["silverstone", "2026-07-03", "2026-07-05"], ["spa", "2026-07-17", "2026-07-19"],
    ["hungaroring", "2026-07-24", "2026-07-26"], ["monza", "2026-09-04", "2026-09-06"],
    ["madrid", "2026-09-11", "2026-09-13"],
  ],
} as const;

const venueNames: Record<string, string> = {
  melbourne: "Melbourne", monaco: "Monaco", barcelona: "Barcelona-Catalunya",
  "red-bull-ring": "Spielberg", silverstone: "Silverstone", spa: "Spa-Francorchamps",
  hungaroring: "Budapest", monza: "Monza", madrid: "Madrid", baku: "Baku",
  lusail: "Lusail", "yas-marina": "Yas Marina",
};

const supportEvents = (Object.entries(supportRows) as ["f2" | "f3", readonly (readonly [string, string, string])[]][]).flatMap(
  ([championshipId, rows]) => rows.map(([circuitId, startDate, endDate]) => E({
    championshipId,
    id: `2026-${championshipId}-${circuitId}`,
    name: `${venueNames[circuitId]} Round`,
    circuitId,
    startDate,
    endDate,
    duration: "Sprint + Feature",
    raceType: "Formula",
    officialUrl: championshipId === "f2" ? "https://www.fiaformula2.com/Calendar" : "https://www.fiaformula3.com/Calendar",
  })),
);

const formulaERows = [
  ["sao-paulo", "Sao Paulo E-Prix", "sao-paulo-street", "2025-12-06"],
  ["mexico-city", "Mexico City E-Prix", "mexico-city", "2026-01-10"],
  ["miami", "Miami E-Prix", "miami", "2026-01-31"],
  ["jeddah-1", "Jeddah E-Prix I", "jeddah", "2026-02-13"], ["jeddah-2", "Jeddah E-Prix II", "jeddah", "2026-02-14"],
  ["madrid", "Madrid E-Prix", "madrid", "2026-03-21"],
  ["berlin-1", "Berlin E-Prix I", "berlin-tempelhof", "2026-05-02"], ["berlin-2", "Berlin E-Prix II", "berlin-tempelhof", "2026-05-03"],
  ["monaco-1", "Monaco E-Prix I", "monaco", "2026-05-16"], ["monaco-2", "Monaco E-Prix II", "monaco", "2026-05-17"],
  ["sanya", "Sanya E-Prix", "sanya", "2026-06-20"],
  ["shanghai-1", "Shanghai E-Prix I", "shanghai", "2026-07-04"], ["shanghai-2", "Shanghai E-Prix II", "shanghai", "2026-07-05"],
  ["tokyo-1", "Tokyo E-Prix I", "tokyo", "2026-07-25"], ["tokyo-2", "Tokyo E-Prix II", "tokyo", "2026-07-26"],
  ["london-1", "London E-Prix I", "london-excel", "2026-08-15"], ["london-2", "London E-Prix II", "london-excel", "2026-08-16"],
] as const;
const formulaEEvents = formulaERows.map(([id, name, circuitId, date]) => E({ championshipId: "fe", id: `2026-fe-${id}`, name, circuitId, startDate: date, duration: "E-Prix", raceType: "Formula E" }));

const indyRows = [
  ["st-petersburg", "Firestone Grand Prix of St. Petersburg", "2026-03-01", "12:00"],
  ["phoenix", "Good Ranchers 250", "2026-03-07", "15:00"],
  ["arlington", "Grand Prix of Arlington", "2026-03-15", "12:30"],
  ["barber", "Children's of Alabama Indy Grand Prix", "2026-03-29", "13:00"],
  ["long-beach", "Grand Prix of Long Beach", "2026-04-19", "17:30"],
  ["indianapolis", "Sonsio Grand Prix", "2026-05-09", "16:30"],
  ["indianapolis", "110th Indianapolis 500", "2026-05-24", "10:00"],
  ["detroit", "Detroit Grand Prix", "2026-05-31", "12:30"],
  ["wwtr", "Bommarito Automotive Group 500", "2026-06-07", "21:00"],
  ["road-america", "XPEL Grand Prix at Road America", "2026-06-21", "14:00"],
  ["mid-ohio", "Honda Indy 200 at Mid-Ohio", "2026-07-05", "12:30"],
  ["nashville", "Music City Grand Prix", "2026-07-19", ""],
  ["portland", "Grand Prix of Portland", "2026-08-09", "16:00"],
  ["markham", "Ontario Honda Dealers Indy at Markham", "2026-08-16", "12:00"],
  ["milwaukee", "Milwaukee Mile Race 1", "2026-08-29", "14:30"],
  ["milwaukee", "Milwaukee Mile Race 2", "2026-08-30", "13:00"],
  ["laguna-seca", "Grand Prix of Monterey", "2026-09-06", "14:30"],
] as const;
const indyEvents = indyRows.map(([circuitId, name, date, time], index) => {
  const id = `2026-indy-${String(index + 1).padStart(2, "0")}-${circuitId}`;
  return E({ championshipId: "indy", id, name, circuitId, startDate: date, duration: name.includes("500") ? "500 miles" : "Race", raceType: "Open wheel", sessions: time ? [session(id, "Race broadcast", "race", easternToUtc(date, time))] : [] });
});

const superFormulaRows = [
  ["motegi", "Motegi Rounds 1-2", "2026-04-03", "2026-04-05"],
  ["autopolis", "Autopolis Round", "2026-04-25", "2026-04-26"],
  ["suzuka", "Suzuka Rounds 4-5", "2026-05-22", "2026-05-24"],
  ["fuji", "Fuji Rounds 3, 6-7", "2026-07-17", "2026-07-19"],
  ["sugo", "Sportsland SUGO Round 8", "2026-08-08", "2026-08-09"],
  ["fuji", "Fuji Rounds 9-10", "2026-10-09", "2026-10-11"],
  ["suzuka", "Suzuka Rounds 11-12", "2026-11-20", "2026-11-22"],
] as const;
const superFormulaEvents = superFormulaRows.map(([circuitId, name, startDate, endDate], index) => E({ championshipId: "sf", id: `2026-sf-${index + 1}-${circuitId}`, name, circuitId, startDate, endDate, duration: "Race weekend", raceType: "Formula" }));

const wecRows = [
  ["imola", "6 Hours of Imola", "2026-04-19", "2026-04-19", "6h"], ["spa", "6 Hours of Spa-Francorchamps", "2026-05-09", "2026-05-09", "6h"],
  ["le-mans", "24 Hours of Le Mans", "2026-06-13", "2026-06-14", "24h"], ["interlagos", "6 Hours of Sao Paulo", "2026-07-12", "2026-07-12", "6h"],
  ["cota", "Lone Star Le Mans", "2026-09-06", "2026-09-06", "6h"], ["fuji", "6 Hours of Fuji", "2026-09-27", "2026-09-27", "6h"],
  ["lusail", "Qatar 1812 Km", "2026-10-24", "2026-10-24", "1812 km"], ["bahrain", "8 Hours of Bahrain", "2026-11-07", "2026-11-07", "8h"],
] as const;
const wecEvents = wecRows.map(([circuitId, name, startDate, endDate, duration]) => E({ championshipId: "wec", id: `2026-wec-${circuitId}`, name, circuitId, startDate, endDate, duration, raceType: "Hypercar · LMGT3" }));

const imsaRows = [
  ["daytona", "Rolex 24 at Daytona", "2026-01-21", "2026-01-25", "24h"],
  ["sebring", "12 Hours of Sebring", "2026-03-18", "2026-03-21", "12h"],
  ["long-beach", "Grand Prix of Long Beach", "2026-04-17", "2026-04-18", "100 min"],
  ["laguna-seca", "Monterey SportsCar Championship", "2026-05-01", "2026-05-03", "2h 40m"],
  ["detroit", "Detroit Sports Car Classic", "2026-05-29", "2026-05-30", "100 min"],
  ["watkins-glen", "Six Hours of The Glen", "2026-06-25", "2026-06-28", "6h"],
  ["ctmp", "Chevrolet Grand Prix", "2026-07-10", "2026-07-12", "2h 40m"],
  ["road-america", "Motul SportsCar Endurance Grand Prix", "2026-07-30", "2026-08-02", "6h"],
  ["vir", "Virginia GT Challenge", "2026-08-21", "2026-08-23", "2h 40m"],
  ["indianapolis", "Battle on the Bricks", "2026-09-18", "2026-09-20", "2h 40m"],
  ["road-atlanta", "Petit Le Mans", "2026-09-30", "2026-10-03", "10h"],
] as const;
const imsaEvents = imsaRows.map(([circuitId, name, startDate, endDate, duration]) => E({ championshipId: "imsa", id: `2026-imsa-${circuitId}`, name, circuitId, startDate, endDate, duration, raceType: "GTP · LMP2 · GTD" }));

const elmsRows = [
  ["barcelona", "4 Hours of Barcelona", "2026-04-10", "2026-04-12"], ["paul-ricard", "4 Hours of Le Castellet", "2026-05-01", "2026-05-03"],
  ["imola", "4 Hours of Imola", "2026-07-03", "2026-07-05"], ["spa", "4 Hours of Spa-Francorchamps", "2026-08-21", "2026-08-23"],
  ["silverstone", "4 Hours of Silverstone", "2026-09-11", "2026-09-13"], ["portimao", "4 Hours of Portimao", "2026-10-08", "2026-10-10"],
] as const;
const elmsEvents = elmsRows.map(([circuitId, name, startDate, endDate]) => E({ championshipId: "elms", id: `2026-elms-${circuitId}`, name, circuitId, startDate, endDate, duration: "4h", raceType: "LMP2 · LMP3 · LMGT3" }));

const almsRows = [
  ["sepang", "4 Hours of Sepang", "2025-12-12", "2025-12-14"],
  ["dubai-autodrome", "4 Hours of Dubai", "2026-01-30", "2026-02-01"],
  ["yas-marina", "4 Hours of Abu Dhabi", "2026-02-06", "2026-02-08"],
] as const;
const almsEvents = almsRows.map(([circuitId, name, startDate, endDate]) => E({ championshipId: "alms", id: `2026-alms-${circuitId}`, name, circuitId, startDate, endDate, duration: "2 x 4h", raceType: "LMP2 · LMP3 · GT" }));

const mlmcRows = [
  ["barcelona", "Barcelona Round", "2026-04-10", "2026-04-11", "2h"], ["paul-ricard", "Le Castellet Round", "2026-05-01", "2026-05-02", "2h"],
  ["le-mans", "Road to Le Mans", "2026-06-10", "2026-06-12", "3h"], ["spa", "Spa-Francorchamps Round", "2026-08-21", "2026-08-22", "2h"],
  ["silverstone", "Silverstone Round", "2026-09-11", "2026-09-12", "1h 50m"], ["portimao", "Portimao Round", "2026-10-08", "2026-10-10", "2h"],
] as const;
const mlmcEvents = mlmcRows.map(([circuitId, name, startDate, endDate, duration]) => E({ championshipId: "mlmc", id: `2026-mlmc-${circuitId}`, name, circuitId, startDate, endDate, duration, raceType: "LMP3 · GT3" }));

const nlsRows = [
  ["nls-1", "NLS 1 - 71st ADAC Westfalenfahrt", "2026-03-14", "4h"], ["nls-2", "NLS 2", "2026-03-21", "4h"],
  ["nls-3", "NLS 3", "2026-04-11", "4h"], ["qualifiers", "ADAC 24h Nürburgring Qualifiers", "2026-04-18", "2 x 4h"],
  ["nls-6", "NLS 6", "2026-06-20", "4h"], ["nls-7", "NLS 7", "2026-08-01", "6h"],
  ["nls-8-9", "NLS 8 + 9", "2026-09-12", "2 x 4h"], ["nls-10", "NLS 10", "2026-10-10", "4h"],
] as const;
const nlsEvents = nlsRows.map(([suffix, name, date, duration]) => E({ championshipId: "nls", id: `2026-${suffix}`, name, circuitId: "nurburgring", startDate: date, endDate: suffix === "qualifiers" || suffix === "nls-8-9" ? new Date(Date.parse(`${date}T00:00:00Z`) + 86400000).toISOString().slice(0, 10) : date, duration, raceType: "GT · Multi-class" }));

const n24Id = "2026-nurburgring-24-hours";
const n24Events = [E({
  championshipId: "n24", id: n24Id, name: "Nürburgring 24 Hours", circuitId: "nurburgring",
  startDate: "2026-05-14", endDate: "2026-05-17", duration: "24h", raceType: "GT3 · Multi-class",
  relatedChampionshipIds: ["igtc"],
  sessions: [
    session(n24Id, "Qualifying 1", "qualifying", "2026-05-14T11:15:00Z", "2026-05-14T13:15:00Z"),
    session(n24Id, "Qualifying 2", "qualifying", "2026-05-14T17:55:00Z"),
    session(n24Id, "Top Qualifying", "qualifying", "2026-05-15T11:30:00Z"),
    session(n24Id, "Warm-up", "warmup", "2026-05-16T08:00:00Z", "2026-05-16T09:00:00Z"),
    session(n24Id, "24 Hour Race", "race", "2026-05-16T13:00:00Z", "2026-05-17T13:00:00Z"),
  ],
} )];

export const formulaAndEnduranceEvents: MotorsportEvent[] = [
  ...f1Events, ...supportEvents, ...formulaEEvents, ...indyEvents, ...superFormulaEvents,
  ...wecEvents, ...imsaEvents, ...elmsEvents, ...almsEvents, ...mlmcEvents, ...nlsEvents, ...n24Events,
];
