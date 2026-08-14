import type { Metadata } from "next";
import { byCircuit, bySeries, races } from "../../lib/data";

export { default } from "../page";

export async function generateMetadata({ params }: { params: Promise<{ slug: string[] }> }): Promise<Metadata> {
  const { slug } = await params;
  if (slug[0] === "event" && slug[1]) {
    const race = races.find((item) => item.id === slug[1]);
    if (race) {
      const championship = bySeries(race.series);
      const circuit = byCircuit(race.circuit);
      const description = `${circuit.name}, ${circuit.country}. ${race.eventStart} to ${race.end}. Confirmed schedule and timezone conversion.`;
      return {
        title: `${championship.name} - ${race.name}`,
        description,
        openGraph: { title: `${championship.name} - ${race.name}`, description, type: "article", url: `/event/${race.id}` },
      };
    }
  }
  if (slug[0] === "circuit" && slug[1]) {
    const circuit = byCircuit(slug[1]);
    if (circuit) return { title: circuit.name, description: `Upcoming verified motorsport events at ${circuit.name}, ${circuit.country}.` };
  }
  return {};
}
