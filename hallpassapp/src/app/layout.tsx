import type { Metadata } from "next";
import { Cormorant_Garamond, DM_Sans } from "next/font/google";
import { SiteFooter } from "@/components/SiteFooter";
import "./globals.css";

const hpSans = DM_Sans({
  variable: "--font-hp-sans",
  subsets: ["latin"],
});

const hpDisplay = Cormorant_Garamond({
  variable: "--font-hp-display",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
});

export const metadata: Metadata = {
  title: "Hall Pass",
  description:
    "Discover people who look like your celebrity hall pass—with consent-first intent and safety built in.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${hpSans.variable} ${hpDisplay.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col font-sans">
        {children}
        <SiteFooter />
      </body>
    </html>
  );
}
