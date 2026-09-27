import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono, Imbue } from "next/font/google";
import SmoothScroll from "@/components/SmoothScroll";
import "./globals.css";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });
const display = Imbue({ variable: "--font-display-face", subsets: ["latin"], axes: ["opsz"] });

export const metadata: Metadata = {
  title: "ComTech | Infrastructure for the Tokenised Economy",
  description:
    "Swiss tokenisation technology and infrastructure. ComTech helps banks, asset owners and institutions turn real-world assets into programmable digital assets.",
};

export const viewport: Viewport = {
  themeColor: "#0B0A08",
  colorScheme: "dark",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en-GB" className={`${geistSans.variable} ${geistMono.variable} ${display.variable} antialiased`}>
      <body>
        <SmoothScroll />
        {children}
      </body>
    </html>
  );
}
