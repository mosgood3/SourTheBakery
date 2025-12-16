import type { Metadata } from "next";
import { Nunito } from "next/font/google";
import { Cormorant } from "next/font/google";
import "./globals.css";
import { CartProvider } from "./contexts/CartContext";
import { AdminAuthProvider } from "./contexts/AdminAuthContext";
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/next";

const nunito = Nunito({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-nunito",
  display: "swap",
});

const cormorant = Cormorant({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-cormorant",
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
      <body className={`${nunito.variable} ${cormorant.variable}`}>
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
