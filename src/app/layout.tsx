import type { Metadata, Viewport } from "next";
import "./globals.css";
import "./amoled.css";
import { RealtimeProvider } from "@/components/RealtimeProvider";

export const metadata: Metadata = {
  title: "DOOMSDAY — Crew Protocol & Progression",
  description: "Doomsday survivor tracking, task execution, study grinder, and betting protocol.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "DOOMSDAY",
  },
};

export const viewport: Viewport = {
  themeColor: "#0a0a0a",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <head>
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
      </head>
      <body className="bg-background text-gray-100 antialiased min-h-screen selection:bg-indigo-500 selection:text-white">
        <RealtimeProvider>{children}</RealtimeProvider>
      </body>
    </html>
  );
}
