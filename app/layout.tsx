import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Dreamz Project",
  description: "Realtime collaborative storyboard and team project app"
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className="min-h-screen">{children}</body>
    </html>
  );
}
