import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Scheme Matcher — Find government schemes you qualify for",
  description: "Rules decide. AI explains.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen antialiased">{children}</body>
    </html>
  );
}
