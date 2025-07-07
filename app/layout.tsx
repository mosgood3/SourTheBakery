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
  title: "Sour The Bakery",
  description: "Handcrafted sourdough cookies, brownies, loaves, and bagels made with the finest ingredients.",
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
      </body>
    </html>
  );
}
