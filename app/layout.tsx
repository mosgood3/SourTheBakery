import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Playfair_Display } from "next/font/google";
import { Crimson_Text } from "next/font/google";
import { Oi } from "next/font/google";
import { Barrio } from "next/font/google";
import { Rubik_Distressed } from "next/font/google";
import { Lobster } from "next/font/google";
import "./globals.css";
import { CartProvider } from "./contexts/CartContext";
import { AdminAuthProvider } from "./contexts/AdminAuthContext";
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/next";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-playfair",
  display: "swap",
});

const crimson = Crimson_Text({
  subsets: ["latin"],
  weight: ["400", "600", "700"],
  variable: "--font-crimson",
  display: "swap",
});

const oi = Oi({
  subsets: ["latin"],
  weight: ["400"],
  variable: "--font-oi",
  display: "swap",
});

const barrio = Barrio({
  subsets: ["latin"],
  weight: ["400"],
  variable: "--font-barrio",
  display: "swap",
});

const rubikDistressed = Rubik_Distressed({
  subsets: ["latin"],
  weight: ["400"],
  variable: "--font-rubik-distressed",
  display: "swap",
});

const lobster = Lobster({
  subsets: ["latin"],
  weight: ["400"],
  variable: "--font-lobster",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Sour The Bakery - Handcrafted Sourdough Treats",
  description: "Handcrafted sourdough cookies, brownies, loaves, and bagels made with the finest ingredients. Fresh baked daily in Rocky Hill, CT.",
  keywords: ["sourdough", "bakery", "cookies", "brownies", "bread", "bagels", "handcrafted", "Rocky Hill", "Connecticut"],
  authors: [{ name: "Sour The Bakery" }],
  creator: "Sour The Bakery",
  publisher: "Sour The Bakery",
  metadataBase: new URL('https://sourthebakery.com'),
  
  // Favicon and icons
  icons: {
    icon: "/favicon.ico",
    shortcut: "/favicon.ico",
    apple: "/favicon.ico",
  },
  
  // Open Graph for social media
  openGraph: {
    title: "Sour The Bakery - Handcrafted Sourdough Treats",
    description: "Handcrafted sourdough cookies, brownies, loaves, and bagels made with the finest ingredients. Fresh baked daily in Rocky Hill, CT.",
    url: "https://sourthebakery.com",
    siteName: "Sour The Bakery",
    type: "website",
    locale: "en_US",
    images: [
      {
        url: "/favicon.ico",
        width: 32,
        height: 32,
        alt: "Sour The Bakery Favicon",
      },
    ],
  },
  
  // Twitter Cards
  twitter: {
    card: "summary_large_image",
    title: "Sour The Bakery - Handcrafted Sourdough Treats",
    description: "Handcrafted sourdough cookies, brownies, loaves, and bagels made with the finest ingredients. Fresh baked daily in Rocky Hill, CT.",
    creator: "@sourthebakery",
    images: [
      {
        url: "/favicon.ico",
        alt: "Sour The Bakery Favicon",
      },
    ],
  },
  
  // Additional metadata
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  
  // Verification (add these when you have them)
  // verification: {
  //   google: 'your-google-site-verification',
  //   yandex: 'your-yandex-verification',
  //   yahoo: 'your-yahoo-site-verification',
  // },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={`${inter.variable} ${playfair.variable} ${crimson.variable} ${oi?.variable || ''} ${barrio?.variable || ''} ${rubikDistressed?.variable || ''} ${lobster.variable}`}>
        <AdminAuthProvider>
          <CartProvider>
            {children}
          </CartProvider>
        </AdminAuthProvider>
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
