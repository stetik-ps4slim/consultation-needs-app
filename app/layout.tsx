import type { Metadata } from "next";
import "./globals.css";
import { siteContent } from "@/lib/site-content";

export const metadata: Metadata = {
  title: `${siteContent.brand.name} | Premium Personal Training`,
  description: siteContent.hero.subheading
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en-AU">
      <body className="bg-canvas text-ink antialiased">
        {children}
      </body>
    </html>
  );
}
