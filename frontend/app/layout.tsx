import type { Metadata } from "next";
import "./globals.css";

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
        {children}
      </body>
    </html>
  );
}
