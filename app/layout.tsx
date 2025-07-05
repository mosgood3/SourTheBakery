import type { Metadata } from "next";
import { Inter, Playfair_Display } from "next/font/google";
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

export const metadata: Metadata = {
  title: "Sour The Bakery",
  description: "Artisanal sourdough bread, cookies, brownies, and more",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.variable} ${playfair.variable}`}>
        <AdminAuthProvider>
          <CartProvider>
            {children}
          </CartProvider>
        </AdminAuthProvider>
      </body>
    </html>
  );
}
