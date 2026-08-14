import type { MotorsportEvent } from "../types";
import { formulaAndEnduranceEvents } from "./2026-core";
import { gtMotoRallyEvents } from "./2026-gt-moto-rally";
import { nascarEvents } from "./2026-nascar";

export const verifiedEvents2026: MotorsportEvent[] = [
  ...formulaAndEnduranceEvents,
  ...gtMotoRallyEvents,
  ...nascarEvents,
].sort((a, b) => {
  const aTime = a.sessions.find((item) => item.type === "race")?.startTime ?? `${a.endDate}T12:00:00Z`;
  const bTime = b.sessions.find((item) => item.type === "race")?.startTime ?? `${b.endDate}T12:00:00Z`;
  return Date.parse(aTime) - Date.parse(bTime);
});
