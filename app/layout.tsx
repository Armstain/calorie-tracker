import type { Metadata, Viewport } from "next";
import { Inter, Noto_Sans_Bengali } from "next/font/google";
import "./globals.css";
import { QueryProvider } from "@/lib/providers/QueryProvider";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

// Bangla names in the BD food database need a Bengali font: Inter has no
// Bengali glyphs, so without this they fall back to an inconsistent system
// font. Added second in the font stack (see globals.css) so it only kicks
// in for Bengali characters.
const bengali = Noto_Sans_Bengali({
  subsets: ["bengali"],
  variable: "--font-bengali",
  weight: ["400", "700"],
});

export const metadata: Metadata = {
  title: "CalorieMeter - AI Food Calorie Tracker",
  description:
    "Track your daily calories with AI-powered food analysis. Take photos of your meals and get instant calorie estimates using Gemini AI.",
  keywords: [
    "calorie tracker",
    "food analysis",
    "AI",
    "nutrition",
    "diet",
    "health",
  ],
  authors: [{ name: "CalorieMeter" }],
  creator: "CalorieMeter",
  publisher: "CalorieMeter",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "CalorieMeter",
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    title: "CalorieMeter - AI Food Calorie Tracker",
    description: "Track your daily calories with AI-powered food analysis",
    siteName: "CalorieMeter",
  },
  twitter: {
    card: "summary_large_image",
    title: "CalorieMeter - AI Food Calorie Tracker",
    description: "Track your daily calories with AI-powered food analysis",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  // No maximumScale / userScalable: false — blocking pinch-zoom is an
  // accessibility problem, and it buys nothing here.
  // Light theme only: components hardcode white cards and dark text, so
  // the dark variables in globals.css only produced a mismatched half-dark
  // look. Force light until dark mode is implemented properly.
  themeColor: "#ffffff",
  colorScheme: "light",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        {/* PWA and mobile optimization meta tags */}
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="CalorieMeter" />

        {/* Prevent automatic phone number detection */}
        <meta name="format-detection" content="telephone=no" />

        {/* Preconnect to external domains for better performance */}
        <link
          rel="preconnect"
          href="https://generativelanguage.googleapis.com"
        />

        {/* Favicon */}
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
        
        {/* Apple touch icons */}
        <link
          rel="apple-touch-icon"
          sizes="180x180"
          href="/apple-touch-icon.png"
        />
        <link
          rel="icon"
          type="image/png"
          sizes="32x32"
          href="/favicon-32x32.png"
        />
      </head>
      <body
        className={`${inter.variable} ${bengali.variable} antialiased`}
      >
        <QueryProvider>
          {children}
        </QueryProvider>
      </body>
    </html>
  );
}
