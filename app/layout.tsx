import type { Metadata, Viewport } from "next";
import { IBM_Plex_Mono } from "next/font/google";
import { Review } from "@/components/shared/Review";
import "./globals.css";

const plexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: "400",
  style: ["normal", "italic"],
  variable: "--font-plex-mono",
});

export const metadata: Metadata = {
  title: { default: "writing · Arya Patel", template: "%s · Arya Patel" },
  description: "Questions I got curious about, worked out with small simulations you can play with.",
};

export const viewport: Viewport = {
  themeColor: "#faf8f3",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={plexMono.variable}>
      <body>
        {children}
        {process.env.NODE_ENV === "development" && <Review />}
      </body>
    </html>
  );
}
