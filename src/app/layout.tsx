import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "EmpusaAI — The $1 Hedge Fund",
  description:
    "We don't predict the price. We predict the volatility. Our agent scalps the liquidity gap on prediction markets 24/7. $1 minimum.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
