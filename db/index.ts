import { env } from "cloudflare:workers";
import { drizzle } from "drizzle-orm/d1";
import * as schema from "./schema";

export function getDb() {
  const bindings = env as typeof env & { DB?: D1Database };
  if (!bindings.DB) {
    throw new Error(
      "Cloudflare D1 binding `DB` is unavailable. Add the database to wrangler.jsonc before using server-side persistence."
    );
  }

  return drizzle(bindings.DB, { schema });
}
