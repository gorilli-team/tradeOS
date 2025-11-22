import type { Metadata } from "next";
import "./globals.css";
import { PrivyProviderWrapper } from "./privy-provider";

export const metadata: Metadata = {
  title: "tradeOS - Gamified Trading Simulator",
  description: "Trade tokens with a physical controller",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <PrivyProviderWrapper>{children}</PrivyProviderWrapper>
      </body>
    </html>
  );
}
