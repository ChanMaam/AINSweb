import type { Metadata } from "next";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import { Analytics } from "@vercel/analytics/next";
import "./globals.css";
import MockInit from "./MockInit";

export const metadata: Metadata = { title: "AINS" };

export default function RootLayout({ children }:{
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`font-sans ${GeistSans.variable} ${GeistMono.variable}`}>
        <MockInit />   {/* 👈 MUST be before {children} */}
        {children}
        <Analytics />
      </body>
    </html>
  );
}
