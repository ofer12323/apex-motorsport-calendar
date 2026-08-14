import { easternToUtc, event, session } from "./builders";
import type { MotorsportEvent } from "../types";

type NascarRow = readonly [date: string, timeEt: string, circuitId: string, name: string];

const cupRows: NascarRow[] = [
  ["2026-02-01", "20:00", "bowman-gray", "Cook Out Clash"],
  ["2026-02-12", "19:00", "daytona", "Daytona Duels"],
  ["2026-02-15", "14:30", "daytona", "Daytona 500"],
  ["2026-02-22", "15:00", "atlanta", "Atlanta"],
  ["2026-03-01", "15:30", "cota", "Circuit of the Americas"],
  ["2026-03-08", "15:30", "phoenix", "Phoenix Raceway"],
  ["2026-03-15", "16:00", "las-vegas-motor", "Las Vegas"],
  ["2026-03-22", "15:00", "darlington", "Darlington"],
  ["2026-03-29", "15:30", "martinsville", "Martinsville"],
  ["2026-04-12", "15:00", "bristol", "Bristol"],
  ["2026-04-19", "14:00", "kansas", "Kansas"],
  ["2026-04-26", "15:00", "talladega", "Talladega"],
  ["2026-05-03", "15:30", "texas", "Texas"],
  ["2026-05-10", "15:00", "watkins-glen", "Watkins Glen"],
  ["2026-05-17", "15:00", "dover", "NASCAR All-Star Race"],
  ["2026-05-24", "18:00", "charlotte", "Coca-Cola 600"],
  ["2026-05-31", "19:00", "nashville", "Nashville"],
  ["2026-06-07", "15:00", "michigan", "Michigan"],
  ["2026-06-14", "15:00", "pocono", "Pocono"],
  ["2026-06-21", "16:00", "san-diego", "San Diego"],
  ["2026-06-28", "15:30", "sonoma", "Sonoma"],
  ["2026-07-05", "18:00", "chicagoland", "Chicagoland"],
  ["2026-07-12", "19:00", "atlanta", "Atlanta Night Race"],
  ["2026-07-19", "19:00", "north-wilkesboro", "North Wilkesboro"],
  ["2026-07-26", "14:00", "indianapolis", "Indianapolis"],
  ["2026-08-09", "15:30", "iowa", "Iowa"],
  ["2026-08-15", "19:00", "richmond", "Richmond"],
  ["2026-08-23", "15:00", "new-hampshire", "New Hampshire"],
  ["2026-08-29", "19:30", "daytona", "Daytona Night Race"],
  ["2026-09-06", "17:00", "darlington", "Darlington Playoff Race"],
  ["2026-09-13", "15:00", "wwtr", "St. Louis Playoff Race"],
  ["2026-09-19", "19:30", "bristol", "Bristol Playoff Race"],
  ["2026-09-27", "15:00", "kansas", "Kansas Playoff Race"],
  ["2026-10-04", "17:30", "las-vegas-motor", "Las Vegas Playoff Race"],
  ["2026-10-11", "15:00", "charlotte", "Charlotte Roval"],
  ["2026-10-18", "15:00", "phoenix", "Phoenix Playoff Race"],
  ["2026-10-25", "14:00", "talladega", "Talladega Playoff Race"],
  ["2026-11-01", "14:00", "martinsville", "Martinsville Playoff Race"],
  ["2026-11-08", "15:00", "homestead", "NASCAR Cup Series Championship"],
];

const xfinityRows: NascarRow[] = [
  ["2026-02-14", "17:00", "daytona", "Daytona"], ["2026-02-21", "17:00", "atlanta", "Atlanta"],
  ["2026-02-28", "15:00", "cota", "Circuit of the Americas"], ["2026-03-07", "19:30", "phoenix", "Phoenix"],
  ["2026-03-14", "17:30", "las-vegas-motor", "Las Vegas"], ["2026-03-21", "17:30", "darlington", "Darlington"],
  ["2026-03-28", "15:30", "martinsville", "Martinsville"], ["2026-04-04", "14:30", "rockingham", "Rockingham"],
  ["2026-04-11", "19:30", "bristol", "Bristol"], ["2026-04-18", "19:00", "kansas", "Kansas"],
  ["2026-04-25", "16:00", "talladega", "Talladega"], ["2026-05-02", "15:30", "texas", "Texas"],
  ["2026-05-09", "16:00", "watkins-glen", "Watkins Glen"], ["2026-05-16", "16:00", "dover", "Dover"],
  ["2026-05-23", "17:00", "charlotte", "Charlotte"], ["2026-05-30", "19:30", "nashville", "Nashville"],
  ["2026-06-13", "16:00", "pocono", "Pocono"], ["2026-06-20", "17:00", "san-diego", "San Diego"],
  ["2026-06-27", "17:30", "sonoma", "Sonoma"], ["2026-07-04", "17:30", "chicagoland", "Chicagoland"],
  ["2026-07-11", "19:00", "atlanta", "Atlanta Night Race"], ["2026-07-25", "16:00", "indianapolis", "Indianapolis"],
  ["2026-08-08", "17:00", "iowa", "Iowa"], ["2026-08-28", "19:30", "daytona", "Daytona Night Race"],
  ["2026-09-05", "19:30", "darlington", "Darlington"], ["2026-09-12", "19:30", "wwtr", "St. Louis"],
  ["2026-09-18", "19:30", "bristol", "Bristol Playoff Race"], ["2026-10-03", "19:30", "las-vegas-motor", "Las Vegas Playoff Race"],
  ["2026-10-10", "16:00", "charlotte", "Charlotte Roval"], ["2026-10-17", "19:30", "phoenix", "Phoenix Playoff Race"],
  ["2026-10-24", "15:30", "talladega", "Talladega Playoff Race"], ["2026-10-31", "16:00", "martinsville", "Martinsville Playoff Race"],
  ["2026-11-07", "17:00", "homestead", "NASCAR O'Reilly Series Championship"],
];

const truckRows: NascarRow[] = [
  ["2026-02-13", "19:30", "daytona", "Daytona"], ["2026-02-21", "13:30", "atlanta", "Atlanta"],
  ["2026-02-28", "12:00", "st-petersburg", "Grand Prix of St. Petersburg"], ["2026-03-20", "19:30", "darlington", "Darlington"],
  ["2026-04-03", "16:30", "rockingham", "Rockingham"], ["2026-04-10", "19:30", "bristol", "Bristol"],
  ["2026-05-01", "20:00", "texas", "Texas"], ["2026-05-08", "16:30", "watkins-glen", "Watkins Glen"],
  ["2026-05-15", "17:00", "dover", "Dover"], ["2026-05-22", "19:30", "charlotte", "Charlotte"],
  ["2026-05-29", "20:00", "nashville", "Nashville"], ["2026-06-06", "13:30", "michigan", "Michigan"],
  ["2026-06-19", "19:00", "san-diego", "San Diego"], ["2026-07-11", "13:00", "lime-rock", "Lime Rock Park"],
  ["2026-07-18", "12:30", "north-wilkesboro", "North Wilkesboro"], ["2026-07-24", "20:00", "irp", "Indianapolis Raceway Park"],
  ["2026-08-14", "19:30", "richmond", "Richmond"], ["2026-08-22", "13:30", "new-hampshire", "New Hampshire"],
  ["2026-09-17", "20:00", "bristol", "Bristol Playoff Race"], ["2026-09-26", "13:00", "kansas", "Kansas Playoff Race"],
  ["2026-10-09", "17:00", "charlotte", "Charlotte Roval"], ["2026-10-16", "19:30", "phoenix", "Phoenix Playoff Race"],
  ["2026-10-23", "16:00", "talladega", "Talladega Playoff Race"], ["2026-10-30", "18:00", "martinsville", "Martinsville Playoff Race"],
  ["2026-11-06", "19:30", "homestead", "NASCAR Craftsman Truck Series Championship"],
];

function makeEvents(championshipId: "nascar" | "xfinity" | "trucks", rows: NascarRow[]) {
  return rows.map(([date, timeEt, circuitId, name], index) => {
    const id = `2026-${championshipId}-${String(index + 1).padStart(2, "0")}-${circuitId}`;
    return event({
      championshipId,
      id,
      name,
      circuitId,
      startDate: date,
      duration: name.includes("500") ? "500 miles" : name.includes("600") ? "600 miles" : "Race",
      raceType: "Stock cars",
      sessions: [session(id, "Race", "race", easternToUtc(date, timeEt))],
    });
  });
}

export const nascarEvents: MotorsportEvent[] = [
  ...makeEvents("nascar", cupRows),
  ...makeEvents("xfinity", xfinityRows),
  ...makeEvents("trucks", truckRows),
];
