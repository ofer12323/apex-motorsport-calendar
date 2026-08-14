"use client";

export default function ErrorBoundary({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <main className="fatal-error">
      <small>RACE CONTROL</small>
      <h1>This view could not load.</h1>
      <p>The verified schedule cache is still safe. Retry this screen or return to the calendar.</p>
      <button type="button" onClick={reset}>RETRY</button>
      {/* Native navigation avoids the Vinext RSC fallback failing inside an error boundary. */}
      {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
      <a href="/calendar">OPEN CALENDAR</a>
    </main>
  );
}
