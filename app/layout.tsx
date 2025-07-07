import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Playfair_Display } from "next/font/google";
import { Crimson_Text } from "next/font/google";
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
      <body className={`${inter.variable} ${playfair.variable} ${crimson.variable}`}>
        <AdminAuthProvider>
          <CartProvider>
            {children}
          </CartProvider>
        </AdminAuthProvider>
      </body>
    </html>
  );
}
