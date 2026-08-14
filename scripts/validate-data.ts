import { championships } from "../lib/motorsport/catalog";
import { verifiedEvents2026 } from "../lib/motorsport/schedules/2026";
import { dedupeEvents, validateEvents } from "../lib/motorsport/validation";

const deduped = dedupeEvents(verifiedEvents2026);
const result = validateEvents(deduped.events);
const missing = championships.filter((championship) => !deduped.events.some((event) =>
  event.championshipId === championship.id || event.relatedChampionshipIds?.includes(championship.id),
));

if (deduped.duplicatesRemoved) result.errors.push(`${deduped.duplicatesRemoved} duplicate events found`);
if (missing.length) result.errors.push(`Championships without verified events: ${missing.map((item) => item.id).join(", ")}`);

console.log(`Validated ${deduped.events.length} events across ${championships.length} championships.`);
console.log(`${result.warnings.length} events have confirmed dates but no published session timetable.`);
if (result.errors.length) {
  console.error(result.errors.join("\n"));
  process.exit(1);
}
console.log("Data validation passed: dates, timezones, sources, sessions and duplicate keys are valid.");
