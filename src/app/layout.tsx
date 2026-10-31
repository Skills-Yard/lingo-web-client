import type { Metadata, Viewport } from "next";
import "./globals.css";
import { appFont } from "@/lib/fonts";
import { ThemeProvider } from "@/context/ThemeContext";
import { InstallHint } from "@/components/pwa/InstallHint";

export const metadata: Metadata = {
  title: "Lingo - Instructions Intro",
  description: "The instructions introduction flow: how a programmer thinks about instructions.",
  appleWebApp: {
    capable: true,
    title: "Lingo",
    statusBarStyle: "black-translucent",
  },
  other: { "mobile-web-app-capable": "yes", "apple-mobile-web-app-capable": "yes" },
  icons: { apple: "/icon-192.png" },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#090c13",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${appFont.variable} h-full antialiased`}
      data-scroll-behavior="smooth"
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col bg-background text-foreground transition-colors duration-200">
        <ThemeProvider>{children}</ThemeProvider>
        <InstallHint />
      </body>
    </html>
  );
}
