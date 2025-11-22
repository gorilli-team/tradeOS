import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "MemeTrainer - Gamified Meme Trading Simulator",
  description: "Trade meme tokens with a physical controller",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
