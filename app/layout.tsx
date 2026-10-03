import type { Metadata } from "next";

import "./globals.css";

export const metadata: Metadata = {
  title: "BooKademy",
  description: "Turn a PDF into a course you can practise.",
};

export type RootLayoutProps = {
  children: React.ReactNode;
};

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="en">
      <body className="min-h-screen antialiased">{children}</body>
    </html>
  );
}
