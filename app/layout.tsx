import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://apex-motorsport-calendar.roifein.chatgpt.site"),
  title: { default: "Apex Motorsport Calendar", template: "%s | Apex" },
  description: "Verified schedules for Formula 1, endurance, GT, motorcycles, rally, IndyCar and NASCAR in your timezone.",
  manifest: "/manifest.webmanifest",
  applicationName: "Apex Motorsport Calendar",
  appleWebApp: { capable: true, statusBarStyle: "black-translucent", title: "Apex" },
  openGraph: {
    type: "website",
    siteName: "Apex Motorsport Calendar",
    title: "Apex Motorsport Calendar",
    description: "Real motorsport schedules, one calendar, automatically converted to your timezone.",
    url: "/",
  },
  twitter: { card: "summary", title: "Apex Motorsport Calendar", description: "Verified global motorsport schedules in your timezone." },
  other: {
    "codex-preview": "development",
  },
  icons: {
    icon: [{ url: "/favicon.svg", type: "image/svg+xml" }, { url: "/icon-192.png", sizes: "192x192", type: "image/png" }],
    shortcut: "/favicon.svg",
    apple: "/icon-192.png",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#080a0e",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        {children}
      </body>
    </html>
  );
}
