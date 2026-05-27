import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Logos AI — Christianity Assistant",
  description:
    "A Scripture-grounded, denomination-aware Christian AI assistant with biblical integrity.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="antialiased font-serif">{children}</body>
    </html>
  );
}
