import type { Metadata } from "next";
import "./globals.css";
import LocaleBootstrap from "@/components/LocaleBootstrap";

export const metadata: Metadata = {
  title: "Toro - Smart Financial Event Tracker",
  description: "Personalized financial event tracker and news analyzer",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="antialiased" suppressHydrationWarning>
        <LocaleBootstrap />
        {children}
      </body>
    </html>
  );
}
