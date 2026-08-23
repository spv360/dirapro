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
  title: "DiraPro — Your Expertise Deserves a Digital Identity",
  description:
    "DiraPro helps professionals build a credible digital identity around their expertise, experience, knowledge, achievements, and professional story.",
  keywords: [
    "professional identity",
    "professional profile",
    "professional knowledge",
    "personal branding",
    "DiraPro",
  ],
  openGraph: {
    title: "DiraPro — Your Expertise Deserves a Digital Identity",
    description:
      "A professional identity and knowledge platform for showcasing expertise, experience, knowledge, and impact.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} antialiased`}
    >
      <body>{children}</body>
    </html>
  );
}