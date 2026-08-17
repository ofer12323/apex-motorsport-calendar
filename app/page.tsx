"use client";

import { usePathname } from "next/navigation";
import {
  useEffect,
  useMemo,
  useState,
  useSyncExternalStore,
  type AnchorHTMLAttributes,
  type CSSProperties,
  type ReactNode,
} from "react";
import {
  byCircuit,
  bySeries,
  circuits,
  eventMatchesSeries,
  eventSortTime,
  isDateOnly,
  races,
  series,
  toRace,
  type Race,
} from "@/lib/data";
import type { ProviderStatus, ScheduleSnapshot } from "@/lib/motorsport/types";

const DEFAULT_SERIES = ["f1", "wec", "imsa", "nls", "gtwce"];
const DEFAULT_FAVORITES = [
  "2026-nurburgring-24-hours",
  "2026-wec-le-mans",
  "2026-spa-24-hours",
  "2026-imsa-daytona",
];
const DEFAULT_REMINDERS = ["1 hour before", "15 minutes before"];
const STORAGE_KEY = "apex-prefs";

const CATEGORIES = [
  "FORMULA",
  "ENDURANCE",
  "GT",
  "TOURING CARS",
  "MOTORCYCLES",
  "RALLY",
  "AMERICAN MOTORSPORT",
  "OTHER",
];

const TIMEZONES = [
  ["UTC", "UTC"],
  ["Asia/Bangkok", "Bangkok (UTC+7)"],
  ["Asia/Jerusalem", "Jerusalem"],
  ["Europe/London", "London"],
  ["Europe/Paris", "Central Europe"],
  ["America/New_York", "New York"],
  ["Asia/Tokyo", "Tokyo"],
  ["Australia/Sydney", "Sydney"],
] as const;

const NAV_ITEMS = [
  ["home", "Home", "/", "H"],
  ["calendar", "Calendar", "/calendar", "C"],
  ["series", "My Series", "/series", "S"],
  ["circuits", "Circuits", "/circuits", "T"],
  ["weekend", "This Weekend", "/weekend", "W"],
  ["favorites", "Favorites", "/favorites", "F"],
  ["search", "Search", "/search", "Q"],
  ["profile", "Settings", "/profile", "P"],
] as const;

type Theme = "dark" | "light";

function Link({ href, ...props }: AnchorHTMLAttributes<HTMLAnchorElement> & { href: string }) {
  return <a href={href} {...props} />;
}
type Preferences = {
  selected: string[];
  favorites: string[];
  timezone: string;
  theme: Theme;
  reminders: string[];
};

const DEFAULT_PREFERENCES: Preferences = {
  selected: DEFAULT_SERIES,
  favorites: DEFAULT_FAVORITES,
  timezone: "UTC",
  theme: "dark",
  reminders: DEFAULT_REMINDERS,
};
const DEFAULT_PREFERENCES_RAW = JSON.stringify(DEFAULT_PREFERENCES);

function parsePreferences(raw: string): Preferences {
  try {
    const parsed = JSON.parse(raw) as Partial<Preferences>;
    return {
      selected: Array.isArray(parsed.selected)
        ? parsed.selected
        : DEFAULT_SERIES,
      favorites: Array.isArray(parsed.favorites)
        ? parsed.favorites
        : DEFAULT_FAVORITES,
      timezone:
        typeof parsed.timezone === "string"
          ? parsed.timezone
          : DEFAULT_PREFERENCES.timezone,
      theme: parsed.theme === "light" ? "light" : "dark",
      reminders: Array.isArray(parsed.reminders)
        ? parsed.reminders
        : DEFAULT_REMINDERS,
    };
  } catch {
    return DEFAULT_PREFERENCES;
  }
}

function subscribeToPreferences(callback: () => void) {
  window.addEventListener("storage", callback);
  window.addEventListener("apex-prefs", callback);
  return () => {
    window.removeEventListener("storage", callback);
    window.removeEventListener("apex-prefs", callback);
  };
}

function getPreferenceSnapshot() {
  if (typeof window === "undefined") return DEFAULT_PREFERENCES_RAW;
  const stored = window.localStorage.getItem(STORAGE_KEY);
  if (stored) return stored;
  const detected = Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
  const initial = JSON.stringify({ ...DEFAULT_PREFERENCES, timezone: detected });
  window.localStorage.setItem(STORAGE_KEY, initial);
  return initial;
}

function writePreferences(
  update: (current: Preferences) => Preferences,
) {
  const next = update(parsePreferences(getPreferenceSnapshot()));
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  window.dispatchEvent(new Event("apex-prefs"));
}

function usePreferences() {
  const raw = useSyncExternalStore(
    subscribeToPreferences,
    getPreferenceSnapshot,
    () => DEFAULT_PREFERENCES_RAW,
  );
  return useMemo(() => parsePreferences(raw), [raw]);
}

function formatDate(
  value: string | Date,
  timezone: string,
  options: Intl.DateTimeFormatOptions,
) {
  if (typeof value === "string" && isDateOnly(value)) {
    return new Intl.DateTimeFormat("en-GB", {
      timeZone: "UTC",
      ...options,
    }).format(new Date(`${value}T12:00:00Z`));
  }
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: timezone,
    ...options,
  }).format(new Date(value));
}

function formatTime(value: string, timezone: string) {
  if (isDateOnly(value)) return "—";
  return formatDate(value, timezone, {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

function formatShortDate(value: string, timezone: string) {
  return formatDate(value, timezone, { day: "numeric", month: "short" });
}

function formatIcsDate(value: string) {
  const resolved = isDateOnly(value) ? `${value}T12:00:00Z` : value;
  return new Date(resolved)
    .toISOString()
    .replace(/[-:]/g, "")
    .replace(/\.\d{3}/, "");
}

function downloadCalendarEvent(title: string, start: string, id: string) {
  const resolved = isDateOnly(start) ? `${start}T12:00:00Z` : start;
  const end = new Date(new Date(resolved).getTime() + 2 * 60 * 60 * 1000);
  const content = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Apex Motorsport Calendar//EN",
    "BEGIN:VEVENT",
    `UID:${id}@apex-calendar`,
    `DTSTAMP:${formatIcsDate(new Date().toISOString())}`,
    `DTSTART:${formatIcsDate(resolved)}`,
    `DTEND:${formatIcsDate(end.toISOString())}`,
    `SUMMARY:${title.replace(/[,;\\]/g, " ")}`,
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n");
  const url = URL.createObjectURL(new Blob([content], { type: "text/calendar" }));
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `${id}.ics`;
  anchor.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function getUpcoming(source: Race[], reference = Date.now()) {
  return source.filter((race) => {
    const end = isDateOnly(race.end) ? Date.parse(`${race.end}T23:59:59Z`) : Date.parse(race.end);
    return end >= reference && race.status !== "CANCELLED";
  }).sort((a, b) => eventSortTime(a) - eventSortTime(b));
}

function getNextSevenDays(source: Race[], reference = Date.now()) {
  const end = reference + 7 * 24 * 60 * 60 * 1000;
  return source.filter((race) => {
    const start = eventSortTime(race);
    return start >= reference && start <= end;
  });
}

function localDateKey(value: string | Date, timezone: string) {
  const parsed = typeof value === "string" && isDateOnly(value) ? new Date(`${value}T12:00:00Z`) : new Date(value);
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: typeof value === "string" && isDateOnly(value) ? "UTC" : timezone,
    year: "numeric", month: "2-digit", day: "2-digit",
  }).formatToParts(parsed);
  const part = (type: string) => parts.find((item) => item.type === type)?.value;
  return `${part("year")}-${part("month")}-${part("day")}`;
}

function getWeekendRange(reference: Date, timezone: string) {
  const today = localDateKey(reference, timezone);
  const anchor = new Date(`${today}T12:00:00Z`);
  const day = anchor.getUTCDay();
  const offset = day === 0 ? -2 : 5 - day;
  anchor.setUTCDate(anchor.getUTCDate() + offset);
  const end = new Date(anchor);
  end.setUTCDate(end.getUTCDate() + 2);
  return { start: anchor.toISOString().slice(0, 10), end: end.toISOString().slice(0, 10) };
}

function raceDateKey(race: Race, timezone: string) {
  return localDateKey(race.start, timezone);
}

function getWeekendRaces(source: Race[], timezone: string, reference = new Date()) {
  const range = getWeekendRange(reference, timezone);
  return source.filter((race) => {
    const value = raceDateKey(race, timezone);
    return value >= range.start && value <= range.end;
  }).sort((a, b) => eventSortTime(a) - eventSortTime(b));
}

function getTodaySessions(source: Race[], timezone: string, reference = new Date()) {
  const today = localDateKey(reference, timezone);
  return source.flatMap((race) => race.sessions
    .filter((item) => localDateKey(item.at, timezone) === today)
    .map((item) => ({ race, session: item })))
    .sort((a, b) => Date.parse(a.session.at) - Date.parse(b.session.at));
}

function getQualifyingSessions(race: Race) {
  return race.sessions
    .filter((item) => item.type === "QUALIFYING" || item.type === "HYPERPOLE")
    .sort((a, b) => Date.parse(a.at) - Date.parse(b.at));
}

function getPrimaryQualifying(race: Race) {
  const sessions = getQualifyingSessions(race);
  return sessions[sessions.length - 1];
}

function getRaceSession(race: Race) {
  return race.sessions.find((item) => item.type === "RACE");
}

function Track({ variant = 1 }: { variant?: number }) {
  const path =
    variant % 2
      ? "M12 70C35 20 80 24 108 48s52 50 93 6 76-19 103 12c15 30-23 59-65 48-39-10-64 32-108 15C72 87 48 119 18 99"
      : "M15 94c35 20 55-66 105-57 39 7 27 56 72 62 42 6 25-51 72-58 35-5 57 23 37 51-22 29-59 13-86 26-42 20-54-22-99-10-46 13-80 8-100-3";
  return (
    <svg viewBox="0 0 320 130" className="track" aria-hidden="true">
      <path d={path} />
      <circle cx="15" cy={variant % 2 ? 70 : 94} r="4" />
    </svg>
  );
}

function Countdown({ to }: { to: string }) {
  const [now, setNow] = useState<number | null>(null);
  useEffect(() => {
    const initial = window.setTimeout(() => setNow(Date.now()), 0);
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => {
      window.clearTimeout(initial);
      window.clearInterval(timer);
    };
  }, []);

  const seconds =
    now === null
      ? null
      : Math.max(0, Math.floor((new Date(to).getTime() - now) / 1000));
  const units = [
    [seconds === null ? "--" : String(Math.floor(seconds / 86400)), "DAYS"],
    [
      seconds === null ? "--" : String(Math.floor((seconds % 86400) / 3600)),
      "HOURS",
    ],
    [
      seconds === null ? "--" : String(Math.floor((seconds % 3600) / 60)),
      "MIN",
    ],
    [seconds === null ? "--" : String(seconds % 60), "SEC"],
  ] as const;

  return (
    <div className="countdown" suppressHydrationWarning>
      {units.map(([value, label]) => (
        <span key={label}>
          <b>{value.padStart(2, "0")}</b>
          <small>{label}</small>
        </span>
      ))}
    </div>
  );
}

function PageHeader({
  eyebrow,
  title,
  copy,
}: {
  eyebrow: string;
  title: string;
  copy: string;
}) {
  return (
    <header className="page-header">
      <small>{eyebrow}</small>
      <h1>{title}</h1>
      <p>{copy}</p>
    </header>
  );
}

function Section({
  index,
  title,
  copy,
  children,
}: {
  index: string;
  title: string;
  copy: string;
  children: ReactNode;
}) {
  return (
    <section className="content-section">
      <header>
        <i>{index}</i>
        <span>
          <h2>{title}</h2>
          <p>{copy}</p>
        </span>
      </header>
      {children}
    </section>
  );
}

function EmptyState({
  title,
  copy,
  href,
  action,
}: {
  title: string;
  copy: string;
  href?: string;
  action?: string;
}) {
  return (
    <div className="empty-state">
      <span>APEX</span>
      <h2>{title}</h2>
      <p>{copy}</p>
      {href && action ? (
        <Link className="button secondary" href={href}>
          {action}
        </Link>
      ) : null}
    </div>
  );
}

type RaceCardProps = {
  race: Race;
  timezone: string;
  favorites: string[];
  onToggleFavorite: (id: string) => void;
};

function RaceCard({
  race,
  timezone,
  favorites,
  onToggleFavorite,
}: RaceCardProps) {
  const championship = bySeries(race.series);
  const circuit = byCircuit(race.circuit);
  const date = formatShortDate(race.start, timezone).split(" ");
  const favorite = favorites.includes(race.id);
  const qualifying = getPrimaryQualifying(race);
  const raceSession = getRaceSession(race);

  return (
    <article
      className="race-card"
      style={{ "--accent": championship.color } as CSSProperties}
    >
      <time className="card-date" dateTime={race.start}>
        <b>{date[0]}</b>
        <small>{date[1]}</small>
        <span>{formatDate(race.start, timezone, { weekday: "short" })}</span>
      </time>
      <div className="race-card-body">
        <header className="race-card-topline">
          <span><i />{championship.name}</span>
        <button
          type="button"
          className={favorite ? "favorite-button active" : "favorite-button"}
          onClick={() => onToggleFavorite(race.id)}
          aria-label={
            favorite
              ? `Remove ${race.name} from favorites`
              : `Add ${race.name} to favorites`
          }
          aria-pressed={favorite}
          title={favorite ? "Remove from favorites" : "Add to favorites"}
        >
          {favorite ? "Saved" : "Save"}
        </button>
        </header>
        <Link href={`/event/${race.id}`} className="race-card-link">
          <div className="card-copy">
            <small>{race.type}</small>
            <h3>{race.name}</h3>
            <p>{circuit.flag} {circuit.name}, {circuit.country}</p>
          </div>
          <div className="race-card-schedule">
            <span className={qualifying ? "confirmed" : "pending"}>
              <small>{qualifying?.name ?? "Qualifying"}</small>
              <b>{qualifying ? formatTime(qualifying.at, timezone) : "Not published"}</b>
              <em>{qualifying ? formatShortDate(qualifying.at, timezone) : "Official schedule pending"}</em>
            </span>
            <span className={raceSession ? "confirmed" : "pending"}>
              <small>Race</small>
              <b>{raceSession ? formatTime(raceSession.at, timezone) : formatShortDate(race.start, timezone)}</b>
              <em>{raceSession ? formatShortDate(raceSession.at, timezone) : "Start time pending"}</em>
            </span>
          </div>
          <footer>
            <span>{race.duration}</span>
            <b>Event details <i aria-hidden="true">→</i></b>
          </footer>
        </Link>
      </div>
    </article>
  );
}

function RaceCards(props: Omit<RaceCardProps, "race"> & { source: Race[] }) {
  return (
    <div className="race-cards">
      {props.source.map((race) => (
        <RaceCard key={race.id} race={race} {...props} />
      ))}
    </div>
  );
}

type SharedPageProps = {
  visibleRaces: Race[];
  preferences: Preferences;
  onToggleFavorite: (id: string) => void;
};

function HomePage({
  visibleRaces,
  preferences,
  onToggleFavorite,
  showAll,
  onShowAll,
}: SharedPageProps & { showAll: boolean; onShowAll: (value: boolean) => void }) {
  const upcoming = getUpcoming(visibleRaces);
  const nextRace = upcoming[0] ?? visibleRaces[0];
  if (!nextRace) {
    return (
      <>
        <PageHeader eyebrow="YOUR RACING CALENDAR" title="Never miss a race." copy="Every confirmed session. Your timezone. One command center." />
        <EmptyState title="No events in this view" copy="Choose a championship or switch back to the current season." href="/series" action="CHOOSE SERIES" />
      </>
    );
  }
  const championship = bySeries(nextRace.series);
  const circuit = byCircuit(nextRace.circuit);
  const weekend = getWeekendRaces(visibleRaces, preferences.timezone);
  const today = getTodaySessions(visibleRaces, preferences.timezone);
  const sevenDays = getNextSevenDays(visibleRaces);
  const qualifying = getQualifyingSessions(nextRace);
  const raceSession = getRaceSession(nextRace);

  return (
    <>
      <div className="home-header">
        <PageHeader
          eyebrow="YOUR RACING CALENDAR"
          title="Never miss a race."
          copy="Every confirmed session. Your timezone. One command center."
        />
        <div className="home-actions">
          <button className="button secondary" type="button" onClick={() => onShowAll(!showAll)}>{showAll ? "SHOW MY SERIES" : "SHOW ALL MOTORSPORT"}</button>
          <Link className="button secondary" href="/series">CUSTOMIZE SERIES</Link>
        </div>
      </div>

      <section className="hero" style={{ "--accent": championship.color } as CSSProperties}>
        <div className="hero-copy">
          <div className="hero-kicker">
            <span>{championship.short}</span>
            <small><i /> Next on your calendar</small>
          </div>
          <h2>{nextRace.name}</h2>
          <p className="hero-location">{circuit.flag} {circuit.name} · {circuit.country}</p>
          <p className="hero-date">
            {formatDate(nextRace.start, preferences.timezone, {
              weekday: "long", day: "numeric", month: "long",
            })} <span>·</span> {nextRace.duration}
          </p>
          <label>{nextRace.timingPrecision === "date" ? "Race date confirmed" : "Race starts in"}</label>
          {nextRace.timingPrecision === "date" ? (
            <p className="time-tba">Session times will appear when the organizer publishes the timetable.</p>
          ) : (
            <Countdown to={nextRace.start} />
          )}
          <div className="hero-actions">
            <Link className="button primary" href={`/event/${nextRace.id}`}>Open event</Link>
            <a className="hero-source" href={nextRace.officialUrl ?? nextRace.sourceUrl} target="_blank" rel="noreferrer">Official source ↗</a>
          </div>
        </div>
        <aside className="hero-schedule">
          <header>
            <span><small>Weekend schedule</small><b>Your local time</b></span>
            <i>{preferences.timezone.replace(/_/g, " ")}</i>
          </header>
          <div>
            {qualifying.length ? qualifying.map((session) => (
              <Link href={`/event/${nextRace.id}`} key={session.id} className="hero-session qualifying">
                <span><small>{session.name}</small><b>{formatDate(session.at, preferences.timezone, { weekday: "short", day: "numeric", month: "short" })}</b></span>
                <time dateTime={session.at}>{formatTime(session.at, preferences.timezone)}</time>
              </Link>
            )) : (
              <div className="hero-session pending">
                <span><small>Qualifying</small><b>Official time not published</b></span>
                <time>—</time>
              </div>
            )}
            <Link href={`/event/${nextRace.id}`} className="hero-session race">
              <span><small>Race</small><b>{formatDate(nextRace.start, preferences.timezone, { weekday: "short", day: "numeric", month: "short" })}</b></span>
              <time dateTime={raceSession?.at ?? nextRace.start}>{raceSession ? formatTime(raceSession.at, preferences.timezone) : "Date set"}</time>
            </Link>
          </div>
          <footer><span>Times converted automatically</span><b>{circuit.length ? `${circuit.length} km` : circuit.name}{circuit.corners ? ` · ${circuit.corners} turns` : ""}</b></footer>
        </aside>
      </section>

      <div className="stats-bar">
        <span>
          <b>{String(preferences.selected.length).padStart(2, "0")}</b>
          <small>SERIES FOLLOWED</small>
        </span>
        <span>
          <b>{String(weekend.length).padStart(2, "0")}</b>
          <small>THIS WEEKEND</small>
        </span>
        <span>
          <b>{String(sevenDays.length).padStart(2, "0")}</b>
          <small>NEXT 7 DAYS</small>
        </span>
        <span>
          <b>LOCAL</b>
          <small>AUTO TIME CONVERSION</small>
        </span>
      </div>

      <Section
        index="01"
        title="Racing today"
        copy="Confirmed sessions happening today in your timezone"
      >
        {today.length ? (
          <div className="today-list">
            {today.map(({ race, session: current }) => (
              <Link href={`/event/${race.id}`} key={current.id}>
                <i style={{ background: bySeries(race.series).color }}>{bySeries(race.series).short}</i>
                <span><b>{race.name}</b><small>{current.name}</small></span>
                <time>{formatTime(current.at, preferences.timezone)}</time>
              </Link>
            ))}
          </div>
        ) : (
          <EmptyState title="No racing today" copy="No confirmed sessions from your selected championships happen today." />
        )}
      </Section>

      <Section
        index="02"
        title="Racing this weekend"
        copy="Friday through Sunday, converted to your timezone"
      >
        {weekend.length ? (
          <div className="weekend-board">
            <div className="weekend-date">
              <small>
                {formatDate(
                  weekend[0].start,
                  preferences.timezone,
                  { month: "short" },
                ).toUpperCase()}
              </small>
              <b>
                {formatDate(
                  weekend[0].start,
                  preferences.timezone,
                  { day: "numeric" },
                )}
                -
                {formatDate(
                  weekend[weekend.length - 1].start,
                  preferences.timezone,
                  { day: "numeric" },
                )}
              </b>
              <span>
                {formatDate(
                  weekend[0].start,
                  preferences.timezone,
                  { year: "numeric" },
                )}
              </span>
            </div>
            <div className="weekend-list">
              {weekend.map((race) => {
                const itemSeries = bySeries(race.series);
                const itemCircuit = byCircuit(race.circuit);
                const itemQualifying = getPrimaryQualifying(race);
                const itemRace = getRaceSession(race);
                return (
                  <Link key={race.id} href={`/event/${race.id}`}>
                    <i style={{ background: itemSeries.color }}>
                      {itemSeries.short}
                    </i>
                    <span>
                      <b>{race.name}</b>
                      <small>
                        {itemCircuit.flag} {itemCircuit.name}
                      </small>
                    </span>
                    <span className="weekend-session">
                      <small>Qualifying</small>
                      <time>{itemQualifying ? formatTime(itemQualifying.at, preferences.timezone) : "—"}</time>
                    </span>
                    <span className="weekend-session">
                      <small>Race</small>
                      <time>{itemRace ? formatTime(itemRace.at, preferences.timezone) : formatShortDate(race.start, preferences.timezone)}</time>
                    </span>
                    <em>→</em>
                  </Link>
                );
              })}
            </div>
          </div>
        ) : (
          <EmptyState
            title="A quiet weekend"
            copy="No selected championships are racing this weekend."
            href="/series"
            action="EDIT MY SERIES"
          />
        )}
      </Section>

      <Section
        index="03"
        title="Upcoming races"
        copy="Your personalized race feed"
      >
        {upcoming.length ? (
          <RaceCards
            source={upcoming.slice(0, 6)}
            timezone={preferences.timezone}
            favorites={preferences.favorites}
            onToggleFavorite={onToggleFavorite}
          />
        ) : (
          <EmptyState
            title="No upcoming races"
            copy="Select more championships to refill your calendar."
            href="/series"
            action="CHOOSE SERIES"
          />
        )}
      </Section>
    </>
  );
}

function SeriesPage({
  preferences,
  showAll,
  onShowAll,
}: {
  preferences: Preferences;
  showAll: boolean;
  onShowAll: (value: boolean) => void;
}) {
  const toggleSeries = (id: string) => {
    writePreferences((current) => ({
      ...current,
      selected: current.selected.includes(id)
        ? current.selected.filter((item) => item !== id)
        : [...current.selected, id],
    }));
  };

  return (
    <>
      <PageHeader
        eyebrow="PERSONALIZE"
        title="My series"
        copy="Build a feed around the championships you actually watch."
      />
      <div className="series-toolbar">
        <b>{preferences.selected.length} selected</b>
        <button
          type="button"
          onClick={() =>
            writePreferences((current) => ({
              ...current,
              selected: series.map((item) => item.id),
            }))
          }
        >
          SELECT ALL
        </button>
        <button
          type="button"
          onClick={() =>
            writePreferences((current) => ({ ...current, selected: [] }))
          }
        >
          CLEAR ALL
        </button>
        <label>
          SHOW ALL EVENTS
          <input
            type="checkbox"
            checked={showAll}
            onChange={(event) => onShowAll(event.target.checked)}
          />
        </label>
      </div>
      {CATEGORIES.map((category) => {
        const items = series.filter((item) => item.category === category);
        return (
          <section className="series-group" key={category}>
            <h2>
              {category}
              <small>{items.length} SERIES</small>
            </h2>
            <div>
              {items.map((item) => {
                const selected = preferences.selected.includes(item.id);
                return (
                  <button
                    type="button"
                    key={item.id}
                    className={selected ? "selected" : ""}
                    style={{ "--accent": item.color } as CSSProperties}
                    onClick={() => toggleSeries(item.id)}
                    aria-pressed={selected}
                  >
                    <i>{item.short}</i>
                    <em>{selected ? "ON" : "OFF"}</em>
                    <h3>{item.name}</h3>
                    <p>{item.races} races</p>
                  </button>
                );
              })}
            </div>
          </section>
        );
      })}
    </>
  );
}

function Timeline({
  source,
  timezone,
}: {
  source: Race[];
  timezone: string;
}) {
  return (
    <div className="timeline">
      {source.map((race) => {
        const championship = bySeries(race.series);
        const circuit = byCircuit(race.circuit);
        const qualifying = getPrimaryQualifying(race);
        const raceSession = getRaceSession(race);
        return (
          <Link
            key={race.id}
            href={`/event/${race.id}`}
            style={{ "--accent": championship.color } as CSSProperties}
          >
            <time>
              <b>
                {formatDate(race.start, timezone, { day: "2-digit" })}
              </b>
              <small>
                {formatDate(race.start, timezone, {
                  month: "short",
                }).toUpperCase()}
              </small>
            </time>
            <i />
            <span>
              <small>{championship.name}</small>
              <b>{race.name}</b>
              <em>
                {circuit.flag} {circuit.name}
              </em>
            </span>
            <span className="timeline-times">
              <small>Q {qualifying ? formatTime(qualifying.at, timezone) : "—"}</small>
              <strong>R {raceSession ? formatTime(raceSession.at, timezone) : formatShortDate(race.start, timezone)}</strong>
            </span>
          </Link>
        );
      })}
    </div>
  );
}

function CalendarPage({
  visibleRaces,
  allRaces,
  season,
  preferences,
  onToggleFavorite,
  view,
  onView,
}: SharedPageProps & {
  allRaces: Race[];
  season: number;
  view: string;
  onView: (view: string) => void;
}) {
  const currentDateKey = localDateKey(new Date(), preferences.timezone);
  const [calendarMonth, setCalendarMonth] = useState(
    season === Number(currentDateKey.slice(0, 4))
      ? Number(currentDateKey.slice(5, 7)) - 1
      : 0,
  );
  const [championshipFilter, setChampionshipFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [countryFilter, setCountryFilter] = useState("all");
  const [circuitFilter, setCircuitFilter] = useState("all");
  const [durationFilter, setDurationFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("");
  const [onlyToday, setOnlyToday] = useState(false);
  const [onlyWeekend, setOnlyWeekend] = useState(false);
  const [onlySelected, setOnlySelected] = useState(true);

  const calendarYear = season;
  const baseSource = onlySelected ? visibleRaces : allRaces;
  const todayKey = currentDateKey;
  const weekendRange = getWeekendRange(new Date(), preferences.timezone);
  const filteredRaces = baseSource.filter((race) => {
    const championship = bySeries(race.series);
    const circuit = byCircuit(race.circuit);
    const raceDate = raceDateKey(race, preferences.timezone);
    const inMonth = Number(raceDate.slice(5, 7)) - 1 === calendarMonth;
    return inMonth &&
      (championshipFilter === "all" || eventMatchesSeries(race, championshipFilter)) &&
      (categoryFilter === "all" || championship.category === categoryFilter) &&
      (countryFilter === "all" || circuit.countryCode === countryFilter) &&
      (circuitFilter === "all" || circuit.id === circuitFilter) &&
      (durationFilter === "all" || race.duration === durationFilter) &&
      (!dateFilter || raceDate === dateFilter) &&
      (!onlyToday || raceDate === todayKey) &&
      (!onlyWeekend || (raceDate >= weekendRange.start && raceDate <= weekendRange.end));
  });
  const offset =
    (new Date(Date.UTC(calendarYear, calendarMonth, 1)).getUTCDay() + 6) % 7;
  const daysInMonth = new Date(
    Date.UTC(calendarYear, calendarMonth + 1, 0),
  ).getUTCDate();
  const cells = Array.from({ length: 42 }, (_, index) => {
    const day = index - offset + 1;
    return day >= 1 && day <= daysInMonth ? day : null;
  });

  return (
    <>
      <PageHeader
        eyebrow="RACE SCHEDULE"
        title="Motorsport calendar"
        copy="Every selected series, every session, translated into your local time."
      />
      <div className="calendar-toolbar">
        <span className="month-controls">
          <button type="button" onClick={() => setCalendarMonth((value) => (value + 11) % 12)} aria-label="Previous month">PREV</button>
          <b>{new Intl.DateTimeFormat("en", { month: "long", timeZone: "UTC" }).format(new Date(Date.UTC(calendarYear, calendarMonth, 1))).toUpperCase()} {calendarYear}</b>
          <button type="button" onClick={() => setCalendarMonth((value) => (value + 1) % 12)} aria-label="Next month">NEXT</button>
        </span>
        <span>
          {["calendar", "timeline", "list"].map((item) => (
            <button
              type="button"
              key={item}
              className={view === item ? "active" : ""}
              onClick={() => onView(item)}
              aria-pressed={view === item}
            >
              {item.toUpperCase()}
            </button>
          ))}
        </span>
      </div>
      <div className="filter-grid">
        <label>CHAMPIONSHIP<select value={championshipFilter} onChange={(event) => setChampionshipFilter(event.target.value)}><option value="all">All</option>{series.map((item) => <option value={item.id} key={item.id}>{item.name}</option>)}</select></label>
        <label>CATEGORY<select value={categoryFilter} onChange={(event) => setCategoryFilter(event.target.value)}><option value="all">All</option>{CATEGORIES.map((item) => <option value={item} key={item}>{item}</option>)}</select></label>
        <label>COUNTRY<select value={countryFilter} onChange={(event) => setCountryFilter(event.target.value)}><option value="all">All</option>{[...new Map(baseSource.map((race) => { const item = byCircuit(race.circuit); return [item.countryCode, item]; })).values()].sort((a, b) => a.country.localeCompare(b.country)).map((item) => <option value={item.countryCode} key={item.countryCode}>{item.country}</option>)}</select></label>
        <label>CIRCUIT<select value={circuitFilter} onChange={(event) => setCircuitFilter(event.target.value)}><option value="all">All</option>{[...new Map(baseSource.map((race) => [race.circuit, byCircuit(race.circuit)])).values()].sort((a, b) => a.name.localeCompare(b.name)).map((item) => <option value={item.id} key={item.id}>{item.name}</option>)}</select></label>
        <label>DATE<input type="date" value={dateFilter} onChange={(event) => setDateFilter(event.target.value)} /></label>
        <label>DURATION<select value={durationFilter} onChange={(event) => setDurationFilter(event.target.value)}><option value="all">All</option>{[...new Set(baseSource.map((race) => race.duration))].sort().map((item) => <option value={item} key={item}>{item}</option>)}</select></label>
        <label className="check-filter"><input type="checkbox" checked={onlyToday} onChange={(event) => setOnlyToday(event.target.checked)} /> TODAY</label>
        <label className="check-filter"><input type="checkbox" checked={onlyWeekend} onChange={(event) => setOnlyWeekend(event.target.checked)} /> THIS WEEKEND</label>
        <label className="check-filter"><input type="checkbox" checked={onlySelected} onChange={(event) => setOnlySelected(event.target.checked)} /> MY SERIES</label>
      </div>
      {!filteredRaces.length ? (
        <EmptyState
          title="Your calendar is empty"
          copy="No verified events match this month and filter combination."
          href="/series"
          action="CHOOSE SERIES"
        />
      ) : view === "calendar" ? (
        <div
          className="calendar-scroll"
          role="region"
          aria-label={`${calendarYear} race calendar`}
          tabIndex={0}
        >
          <div className="calendar-grid">
            <header>
              {["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"].map(
                (day) => <b key={day}>{day}</b>,
              )}
            </header>
            {cells.map((day, index) => {
              const cellDateKey = day
                ? `${calendarYear}-${String(calendarMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`
                : null;
              const isToday = cellDateKey === todayKey;
              return (
              <div
                className={day ? (isToday ? "today" : "") : "outside"}
                key={`${day ?? "empty"}-${index}`}
                aria-current={isToday ? "date" : undefined}
              >
                <span>{day}{isToday ? <small>TODAY</small> : null}</span>
                {day
                  ? filteredRaces
                      .filter((race) => {
                        return Number(raceDateKey(race, preferences.timezone).slice(8, 10)) === day;
                      })
                      .map((race) => (
                        <Link
                          key={race.id}
                          href={`/event/${race.id}`}
                          style={
                            {
                              "--accent": bySeries(race.series).color,
                            } as CSSProperties
                          }
                        >
                          <b>{bySeries(race.series).short}</b>
                          <small>{race.name}</small>
                        </Link>
                      ))
                  : null}
              </div>
              );
            })}
          </div>
        </div>
      ) : view === "timeline" ? (
        <Timeline source={filteredRaces} timezone={preferences.timezone} />
      ) : (
        <RaceCards
          source={filteredRaces}
          timezone={preferences.timezone}
          favorites={preferences.favorites}
          onToggleFavorite={onToggleFavorite}
        />
      )}
    </>
  );
}

function SearchPage({
  allRaces,
  query,
  onQuery,
  preferences,
  onToggleFavorite,
}: {
  allRaces: Race[];
  query: string;
  onQuery: (query: string) => void;
  preferences: Preferences;
  onToggleFavorite: (id: string) => void;
}) {
  const normalize = (value: string) => value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
  const normalized = normalize(query.trim());
  const results = normalized
    ? allRaces.filter((race) =>
        normalize(`${race.name} ${race.type} ${bySeries(race.series).name} ${bySeries(race.series).short} ${byCircuit(race.circuit).name} ${byCircuit(race.circuit).city ?? ""} ${byCircuit(race.circuit).country} ${race.series === "xfinity" ? "Xfinity" : ""}`)
          .includes(normalized),
      )
    : [];

  return (
    <>
      <PageHeader
        eyebrow="GLOBAL SEARCH"
        title="Find any race."
        copy="Search events, circuits, championships and categories."
      />
      <label className="search-box">
        <span>SEARCH</span>
        <input
          autoFocus
          value={query}
          onChange={(event) => onQuery(event.target.value)}
          placeholder="Le Mans, F1, GT3, Spa..."
        />
        {query ? (
          <button
            type="button"
            onClick={() => onQuery("")}
            aria-label="Clear search"
          >
            CLEAR
          </button>
        ) : null}
      </label>
      {!normalized ? (
        <div className="search-chips">
          {["Le Mans", "Nurburgring", "Spa", "F1", "WEC", "IMSA", "GT3"].map(
            (item) => (
              <button
                type="button"
                onClick={() => onQuery(item)}
                key={item}
              >
                {item}
              </button>
            ),
          )}
        </div>
      ) : results.length ? (
        <>
          <p className="result-count">{results.length} MATCHING EVENTS</p>
          <RaceCards
            source={results}
            timezone={preferences.timezone}
            favorites={preferences.favorites}
            onToggleFavorite={onToggleFavorite}
          />
        </>
      ) : (
        <EmptyState
          title="No matching races"
          copy="Try a championship, circuit or category name."
        />
      )}
    </>
  );
}

function EventPage({
  id,
  allRaces,
  preferences,
  onToggleFavorite,
  onCalendarAdded,
}: {
  id: string;
  allRaces: Race[];
  preferences: Preferences;
  onToggleFavorite: (id: string) => void;
  onCalendarAdded: (message: string) => void;
}) {
  const race = allRaces.find((item) => item.id === id);
  if (!race) {
    return <EmptyState title="Event not found" copy="This event is not available in the selected season." href="/calendar" action="OPEN CALENDAR" />;
  }
  const championship = bySeries(race.series);
  const circuit = byCircuit(race.circuit);
  const favorite = preferences.favorites.includes(race.id);
  const qualifying = getPrimaryQualifying(race);
  const addEvent = (title: string, start: string, eventId: string) => {
    downloadCalendarEvent(title, start, eventId);
    onCalendarAdded(`${title} calendar file downloaded`);
  };

  return (
    <>
      <section
        className="event-hero"
        style={{ "--accent": championship.color } as CSSProperties}
      >
        <div>
          <small>
            <i /> {race.status} | {championship.name}
          </small>
          <h1>{race.name}</h1>
          <p>
            {circuit.flag} {circuit.name} | {circuit.country}
          </p>
          <h3>
            {formatDate(race.eventStart, circuit.tz, {
              day: "numeric",
              month: "long",
              year: "numeric",
            })} - {formatDate(race.end, circuit.tz, { day: "numeric", month: "long", year: "numeric" })} | {race.type}
          </h3>
          <div className="event-actions">
            <button
              type="button"
              className="button primary"
              onClick={() => addEvent(race.name, race.start, race.id)}
            >
              ADD TO CALENDAR
            </button>
            <button
              type="button"
              className="button secondary"
              onClick={() => onToggleFavorite(race.id)}
              aria-pressed={favorite}
            >
              {favorite ? "SAVED" : "SAVE EVENT"}
            </button>
          </div>
        </div>
        <Track variant={race.id.length} />
      </section>
      <div className="event-countdown">
        <b>{race.timingPrecision === "date" ? "EVENT DATE" : "RACE STARTS IN"}</b>
        {race.timingPrecision === "date" ? (
          <strong className="event-tba">
            {formatDate(race.start, preferences.timezone, { day: "numeric", month: "long", year: "numeric" })}
          </strong>
        ) : <Countdown to={race.start} />}
        <span>
          <small>QUALIFYING</small>
          <b>{qualifying ? formatTime(qualifying.at, preferences.timezone) : "Not published"}</b>
        </span>
        <span>
          <small>{race.timingPrecision === "date" ? "TIMETABLE" : "RACE · YOUR TIME"}</small>
          <b>{race.timingPrecision === "date" ? "Pending" : formatTime(race.start, preferences.timezone)}</b>
        </span>
      </div>
      <div className="detail-grid">
        <Section
          index="01"
          title="Race weekend schedule"
          copy="All sessions in your timezone"
        >
          <div className="sessions">
            {race.sessions.length ? race.sessions.map((session) => (
              <div key={session.name} className={session.type === "QUALIFYING" || session.type === "HYPERPOLE" ? "qualifying" : session.type === "RACE" ? "race" : ""}>
                <small>{session.type}</small>
                <b>{session.name}</b>
                <time dateTime={session.at}>
                  {formatTime(session.at, preferences.timezone)}
                  <small>YOUR TIME</small>
                </time>
                <button
                  type="button"
                  onClick={() =>
                    addEvent(
                      `${race.name}: ${session.name}`,
                      session.at,
                      `${race.id}-${session.name.toLowerCase().replace(/\s+/g, "-")}`,
                    )
                  }
                  aria-label={`Add ${session.name} to calendar`}
                  title="Add session to calendar"
                >
                  ADD
                </button>
              </div>
            )) : <div className="session-tba"><b>Weekend timetable not yet published</b><small>The confirmed event dates are shown above. No session time has been invented.</small></div>}
          </div>
        </Section>
        <aside className="event-intelligence">
          <h2>Event intelligence</h2>
          {[
            ["Championship", championship.name],
            ["Duration", race.duration],
            ["Circuit length", circuit.length ? `${circuit.length} km` : "Not published"],
            ["Corners", circuit.corners ? String(circuit.corners) : "Not published"],
            ["Track timezone", circuit.tz],
            ["Source", race.source],
            ["Last verified", formatDate(race.lastUpdated, preferences.timezone, { day: "numeric", month: "short", year: "numeric" })],
          ].map(([label, value]) => (
            <p key={label}>
              <span>{label}</span>
              <b>{value}</b>
            </p>
          ))}
          <a href={race.officialUrl ?? race.sourceUrl} target="_blank" rel="noreferrer" className="official-link">OPEN OFFICIAL EVENT SOURCE</a>
        </aside>
      </div>
    </>
  );
}

function CircuitsPage({ allRaces }: { allRaces: Race[] }) {
  const activeCircuits = circuits.filter((item) => allRaces.some((race) => race.circuit === item.id));
  return (
    <>
      <PageHeader
        eyebrow="TRACK DIRECTORY"
        title="Iconic circuits"
        copy="Explore the places where racing history keeps being written."
      />
      <div className="circuit-grid">
        {activeCircuits.map((circuit, index) => (
          <Link key={circuit.id} href={`/circuit/${circuit.id}`}>
            <div>
              <Track variant={index} />
            </div>
            <small>
              {circuit.country.toUpperCase()} {circuit.flag}
            </small>
            <h2>{circuit.name}</h2>
            <p>
              {circuit.city ? `${circuit.city} | ` : ""}{circuit.length ? `${circuit.length} km` : circuit.tz}
            </p>
          </Link>
        ))}
      </div>
    </>
  );
}

function CircuitPage({
  id,
  allRaces,
  preferences,
  onToggleFavorite,
}: {
  id: string;
  allRaces: Race[];
  preferences: Preferences;
  onToggleFavorite: (id: string) => void;
}) {
  const circuit = circuits.find((item) => item.id === id) ?? circuits[0];
  const circuitRaces = allRaces.filter((race) => race.circuit === circuit.id);
  return (
    <>
      <section className="circuit-hero">
        <div>
          <small>
            {circuit.country.toUpperCase()} {circuit.flag}
          </small>
          <h1>{circuit.name}</h1>
          <p>
            {circuit.length ? `${circuit.length} km | ` : ""}{circuit.corners ? `${circuit.corners} corners | ` : ""}{circuit.tz}
          </p>
        </div>
        <Track variant={circuit.id.length} />
      </section>
      <Section
        index="01"
        title={`Upcoming at ${circuit.name}`}
        copy="Verified championship events at this circuit"
      >
        {circuitRaces.length ? (
          <RaceCards
            source={circuitRaces}
            timezone={preferences.timezone}
            favorites={preferences.favorites}
            onToggleFavorite={onToggleFavorite}
          />
        ) : (
          <EmptyState
            title="No scheduled events"
            copy="No verified events are available for this circuit in the selected season."
          />
        )}
      </Section>
    </>
  );
}

function ProfilePage({ preferences, providers }: { preferences: Preferences; providers: ProviderStatus[] }) {
  const toggleReminder = (reminder: string) => {
    writePreferences((current) => ({
      ...current,
      reminders: current.reminders.includes(reminder)
        ? current.reminders.filter((item) => item !== reminder)
        : [...current.reminders, reminder],
    }));
  };
  const reminderOptions = [
    "1 day before",
    "3 hours before",
    "1 hour before",
    "15 minutes before",
    "When race starts",
  ];

  return (
    <>
      <PageHeader
        eyebrow="PREFERENCES"
        title="Control room settings"
        copy="Tune timezone, alerts and display."
      />
      <div className="settings-grid">
        <section>
          <small>LOCAL TIME</small>
          <h2>Timezone</h2>
          <select
            value={preferences.timezone}
            onChange={(event) =>
              writePreferences((current) => ({
                ...current,
                timezone: event.target.value,
              }))
            }
          >
            {!TIMEZONES.some(([value]) => value === preferences.timezone) ? <option value={preferences.timezone}>{preferences.timezone}</option> : null}
            {TIMEZONES.map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
          <p>Every event and session is converted automatically.</p>
        </section>
        <section>
          <small>NOTIFICATIONS</small>
          <h2>Race alerts</h2>
          {reminderOptions.map((reminder) => (
            <label key={reminder}>
              <input
                type="checkbox"
                checked={preferences.reminders.includes(reminder)}
                onChange={() => toggleReminder(reminder)}
              />
              {reminder}
            </label>
          ))}
          <p>Alert preferences are ready for a browser push provider.</p>
        </section>
        <section>
          <small>DISPLAY</small>
          <h2>Appearance</h2>
          <div className="theme-switch">
            {(["dark", "light"] as Theme[]).map((theme) => (
              <button
                type="button"
                key={theme}
                className={preferences.theme === theme ? "active" : ""}
                onClick={() =>
                  writePreferences((current) => ({ ...current, theme }))
                }
                aria-pressed={preferences.theme === theme}
              >
                {theme.toUpperCase()}
              </button>
            ))}
          </div>
          <p>Your choices are saved on this device.</p>
        </section>
      </div>
      <Section
        index="02"
        title="Schedule source"
        copy="Independent providers fail without taking down the full calendar"
      >
        <div className="provider-list">
          {providers.map((provider) => (
            <div className="provider-status" key={provider.id}>
              <i className={provider.health} />
              <span><b>{provider.name}</b><small>{provider.eventCount} verified events | {provider.message}</small></span>
              <strong>{provider.health.toUpperCase()}</strong>
            </div>
          ))}
        </div>
      </Section>
    </>
  );
}

function AdminDataStatus() {
  const [status, setStatus] = useState<{
    generatedAt: string;
    eventCount: number;
    providers: ProviderStatus[];
    validation: ScheduleSnapshot["validation"];
  } | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    const controller = new AbortController();
    fetch("/api/data-status", { signal: controller.signal, credentials: "same-origin" })
      .then(async (response) => {
        if (!response.ok) throw new Error(response.status === 403 ? "Administrator access is required." : "Status is unavailable.");
        return response.json();
      })
      .then(setStatus)
      .catch((reason) => {
        if (reason instanceof Error && reason.name !== "AbortError") setError(reason.message);
      });
    return () => controller.abort();
  }, []);

  return (
    <>
      <PageHeader eyebrow="PROTECTED OPERATIONS" title="Data status" copy="Provider health, import counts and validation results without secret values." />
      {error ? <EmptyState title="Access unavailable" copy={error} /> : !status ? <div className="loading-state">CHECKING PROVIDERS...</div> : (
        <>
          <div className="admin-summary"><span><b>{status.eventCount}</b><small>EVENTS</small></span><span><b>{status.providers.length}</b><small>PROVIDERS</small></span><span><b>{status.validation.valid ? "PASS" : "FAIL"}</b><small>VALIDATION</small></span><span><b>{status.validation.duplicatesRemoved}</b><small>DUPLICATES REMOVED</small></span></div>
          <div className="admin-table">
            {status.providers.map((provider) => (
              <div key={provider.id}><i className={provider.health} /><span><b>{provider.name}</b><small>{provider.message}</small></span><strong>{provider.eventCount} events</strong><time>{provider.lastSuccessfulSync ? formatDate(provider.lastSuccessfulSync, "UTC", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }) : "Never"}</time></div>
            ))}
          </div>
          <p className="validation-note">{status.validation.errors.length} errors | {status.validation.warnings.length} date-only timetable warnings | Updated {formatDate(status.generatedAt, "UTC", { day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" })} UTC</p>
        </>
      )}
    </>
  );
}

export default function App() {
  const pathname = usePathname();
  const preferences = usePreferences();
  const currentSeason = new Date().getUTCFullYear();
  const [season, setSeason] = useState(currentSeason);
  const [allRaces, setAllRaces] = useState<Race[]>(currentSeason === 2026 ? races : []);
  const [providers, setProviders] = useState<ProviderStatus[]>([]);
  const [dataState, setDataState] = useState<"loading" | "ready" | "fallback" | "empty">("loading");
  const [lastSync, setLastSync] = useState("");
  const [showAll, setShowAll] = useState(false);
  const [query, setQuery] = useState("");
  const [view, setView] = useState("calendar");
  const [toast, setToast] = useState("");

  useEffect(() => {
    document.documentElement.dataset.theme = preferences.theme;
  }, [preferences.theme]);

  useEffect(() => {
    const controller = new AbortController();
    fetch(`/api/schedule?season=${season}`, { signal: controller.signal })
      .then(async (response) => {
        if (!response.ok) throw new Error("Schedule request failed");
        return response.json() as Promise<ScheduleSnapshot>;
      })
      .then((snapshot) => {
        setAllRaces(snapshot.events.map(toRace).sort((a, b) => eventSortTime(a) - eventSortTime(b)));
        setProviders(snapshot.providers);
        setLastSync(snapshot.generatedAt);
        setDataState(snapshot.events.length ? "ready" : "empty");
      })
      .catch((reason) => {
        if (reason instanceof Error && reason.name === "AbortError") return;
        setAllRaces(season === 2026 ? races : []);
        setDataState(season === 2026 ? "fallback" : "empty");
      });
    return () => controller.abort();
  }, [season]);

  useEffect(() => {
    if ("serviceWorker" in navigator) navigator.serviceWorker.register("/sw.js").catch(() => undefined);
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    fetch("/api/preferences", { signal: controller.signal, credentials: "same-origin" })
      .then(async (response) => response.ok ? response.json() : null)
      .then((remote) => {
        if (!remote) return;
        const hasRemote = remote.selected?.length || remote.favorites?.length || remote.reminders?.length || remote.timezone;
        if (!hasRemote) return;
        writePreferences((current) => ({
          ...current,
          selected: Array.isArray(remote.selected) && remote.selected.length ? remote.selected : current.selected,
          favorites: Array.isArray(remote.favorites) && remote.favorites.length ? remote.favorites : current.favorites,
          reminders: Array.isArray(remote.reminders) && remote.reminders.length ? remote.reminders : current.reminders,
          timezone: typeof remote.timezone === "string" ? remote.timezone : current.timezone,
        }));
      })
      .catch(() => undefined);
    return () => controller.abort();
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      fetch("/api/preferences", {
        method: "PUT",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(preferences),
      }).catch(() => undefined);
    }, 900);
    return () => window.clearTimeout(timer);
  }, [preferences]);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(""), 3200);
    return () => window.clearTimeout(timer);
  }, [toast]);

  const visibleRaces = useMemo(
    () =>
      allRaces.filter(
        (race) => showAll || preferences.selected.some((id) => eventMatchesSeries(race, id)),
      ),
    [allRaces, preferences.selected, showAll],
  );

  const toggleFavorite = (id: string) => {
    writePreferences((current) => ({
      ...current,
      favorites: current.favorites.includes(id)
        ? current.favorites.filter((item) => item !== id)
        : [...current.favorites, id],
    }));
  };

  const shared = {
    visibleRaces,
    preferences,
    onToggleFavorite: toggleFavorite,
  };
  let page: ReactNode;
  if (pathname === "/") {
    page = <HomePage {...shared} showAll={showAll} onShowAll={setShowAll} />;
  } else if (pathname.startsWith("/event/")) {
    page = (
      <EventPage
        id={pathname.split("/")[2]}
        allRaces={allRaces}
        preferences={preferences}
        onToggleFavorite={toggleFavorite}
        onCalendarAdded={setToast}
      />
    );
  } else if (pathname.startsWith("/circuit/")) {
    page = (
      <CircuitPage
        id={pathname.split("/")[2]}
        allRaces={allRaces}
        preferences={preferences}
        onToggleFavorite={toggleFavorite}
      />
    );
  } else if (pathname === "/series") {
    page = (
      <SeriesPage
        preferences={preferences}
        showAll={showAll}
        onShowAll={setShowAll}
      />
    );
  } else if (pathname === "/calendar") {
    page = <CalendarPage key={season} {...shared} allRaces={allRaces} season={season} view={view} onView={setView} />;
  } else if (pathname === "/search") {
    page = (
      <SearchPage
        allRaces={allRaces}
        query={query}
        onQuery={setQuery}
        preferences={preferences}
        onToggleFavorite={toggleFavorite}
      />
    );
  } else if (pathname === "/circuits") {
    page = <CircuitsPage allRaces={allRaces} />;
  } else if (pathname === "/favorites") {
    const favorites = allRaces.filter((race) =>
      preferences.favorites.includes(race.id),
    );
    page = (
      <>
        <PageHeader
          eyebrow="SAVED GRID"
          title="Favorite events"
          copy="Your must-watch races, kept in one place."
        />
        {favorites.length ? (
          <RaceCards
            source={favorites}
            timezone={preferences.timezone}
            favorites={preferences.favorites}
            onToggleFavorite={toggleFavorite}
          />
        ) : (
          <EmptyState
            title="No saved events"
            copy="Use the Save control on any race card to build this list."
            href="/calendar"
            action="EXPLORE CALENDAR"
          />
        )}
      </>
    );
  } else if (pathname === "/weekend") {
    const weekend = getWeekendRaces(visibleRaces, preferences.timezone);
    page = (
      <>
        <PageHeader
          eyebrow="WEEKEND CONTROL"
          title="Racing this weekend"
          copy="Friday through Sunday in your local timezone."
        />
        {weekend.length ? (
          <RaceCards
            source={weekend}
            timezone={preferences.timezone}
            favorites={preferences.favorites}
            onToggleFavorite={toggleFavorite}
          />
        ) : (
          <EmptyState
            title="No selected races this weekend"
            copy="Choose more championships or check the full calendar."
            href="/calendar"
            action="OPEN CALENDAR"
          />
        )}
      </>
    );
  } else if (pathname === "/admin/data-status") {
    page = <AdminDataStatus />;
  } else {
    page = <ProfilePage preferences={preferences} providers={providers} />;
  }

  const mobileNav = NAV_ITEMS.filter(([id]) =>
    ["home", "calendar", "series", "search", "profile"].includes(id),
  );
  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <Link href="/" className="logo" aria-label="Apex home">
          <i>A</i>
          <span>
            <b>APEX</b>
            <small>MOTORSPORT CALENDAR</small>
          </span>
        </Link>
        <small>CONTROL CENTER</small>
        <nav aria-label="Primary navigation">
          {NAV_ITEMS.map(([, label, href, icon]) => (
            <Link
              key={href}
              href={href}
              className={isActive(href) ? "active" : ""}
            >
              <i>{icon}</i>
              {label.toUpperCase()}
            </Link>
          ))}
        </nav>
        <div className="sync-status">
          <i className={dataState === "fallback" ? "warning" : ""} /> Schedule sync
          <small>{dataState === "loading" ? "Refreshing providers" : dataState === "fallback" ? "Cached fallback active" : `${allRaces.length} verified events`}</small>
        </div>
      </aside>

      <div className="main-column">
        <header className="topbar">
          <Link href="/" className="mobile-logo" aria-label="Apex home">
            <i>A</i>
            <b>APEX</b>
          </Link>
          <span suppressHydrationWarning>
            <i /> RACE CONTROL |{" "}
            {formatDate(new Date(), preferences.timezone, {
              weekday: "long",
              day: "numeric",
              month: "long",
            }).toUpperCase()}
          </span>
          <div>
            <Link href="/search" className="top-search">
              SEARCH RACES
            </Link>
            <select aria-label="Season" value={season} onChange={(event) => { setDataState("loading"); setSeason(Number(event.target.value)); }}>
              {[currentSeason - 1, currentSeason, currentSeason + 1].map((item) => <option value={item} key={item}>{item} SEASON</option>)}
            </select>
            <select
              aria-label="Timezone"
              value={preferences.timezone}
              onChange={(event) =>
                writePreferences((current) => ({
                  ...current,
                  timezone: event.target.value,
                }))
              }
            >
              {!TIMEZONES.some(([value]) => value === preferences.timezone) ? <option value={preferences.timezone}>{preferences.timezone}</option> : null}
              {TIMEZONES.map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={() =>
                writePreferences((current) => ({
                  ...current,
                  theme: current.theme === "dark" ? "light" : "dark",
                }))
              }
              aria-label={`Switch to ${preferences.theme === "dark" ? "light" : "dark"} theme`}
              title="Toggle color theme"
            >
              {preferences.theme === "dark" ? "LIGHT" : "DARK"}
            </button>
          </div>
        </header>
        <div className="data-notice">
          <b>{dataState === "fallback" ? "CACHED VERIFIED DATA" : dataState === "loading" ? "SYNCING" : "OFFICIAL SCHEDULE DATA"}</b>
          <span>
            {lastSync ? `Last synchronized ${formatDate(lastSync, preferences.timezone, { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}. ` : ""}
            Session times appear as soon as they are published by the organizer.
          </span>
        </div>
        <main>{page}</main>
      </div>

      <nav className="bottom-nav" aria-label="Mobile navigation">
        {mobileNav.map(([, label, href, icon]) => (
          <Link
            key={href}
            href={href}
            className={isActive(href) ? "active" : ""}
          >
            <i>{icon}</i>
            <small>{label}</small>
          </Link>
        ))}
      </nav>
      <div
        className={toast ? "toast visible" : "toast"}
        role="status"
        aria-live="polite"
      >
        {toast}
      </div>
    </div>
  );
}
