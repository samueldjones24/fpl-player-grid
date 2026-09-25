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
  title: "FPL Player Grid",
  description: "A better way to compare FPL players",
  metadataBase: new URL("https://fpl-player-grid.com"),
  icons: {
    icon: "/logo.svg",
    shortcut: "/logo.svg",
    apple: "/logo.svg",
  },
  openGraph: {
    title: "FPL Player Grid",
    description: "A better way to compare FPL players",
    type: "website",
    images: [{ url: "/og-image.png", width: 1200, height: 630, alt: "FPL Player Grid logo" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "FPL Player Grid",
    description: "A better way to compare FPL players",
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
