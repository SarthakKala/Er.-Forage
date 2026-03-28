import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Er. Forge — Engineering Intelligence",
  description:
    "Turn your coding work into structured skill growth. Connect LeetCode, get AI analysis, build a growth portfolio you can show in interviews.",
  openGraph: {
    title: "Er. Forge",
    description: "Engineering intelligence for developers.",
    url: "https://erforge.io"
  }
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col">
        {children}
      </body>
    </html>
  );
}
