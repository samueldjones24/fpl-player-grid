import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "FPL Player Grid | Player Stats & Comparison Tool",
  description:
    "Dive deeper into Fantasy Premier League player stats. Better search, filter, and comparison of points, form, fixtures, history, and more.",
  metadataBase: new URL("https://fpl-player-grid.com"),
  alternates: {
    canonical: "/",
  },
  icons: {
    icon: "/logo.svg",
    shortcut: "/logo.svg",
    apple: "/logo.svg",
  },
  openGraph: {
    title: "FPL Player Grid | Player Stats & Comparison Tool",
    description:
      "Dive deeper into Fantasy Premier League player stats. Better search, filter, and comparison of points, form, fixtures, history, and more.",
    type: "website",
    images: [{ url: "/og-image.png", width: 1200, height: 630, alt: "FPL Player Grid logo" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "FPL Player Grid | Player Stats & Comparison Tool",
    description:
      "Dive deeper into Fantasy Premier League player stats. Better search, filter, and comparison of points, form, fixtures, history, and more.",
    images: ["/og-image.png"],
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
