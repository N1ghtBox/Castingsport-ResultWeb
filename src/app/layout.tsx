import type { Metadata, Viewport } from "next";
import "./globals.css";
import { LangProvider } from "@/lib/i18n";
import FooterSettings from "@/components/FooterSettings";

export const metadata: Metadata = {
  title: "Castingsport Wyniki",
  description: "Wyniki zawodów castingsport",
  applicationName: "Castingsport",
  // Icons and manifest live in public/
  manifest: "/manifest.webmanifest",
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/icons/favicon-32.png", sizes: "32x32", type: "image/png" },
      { url: "/icons/favicon-16.png", sizes: "16x16", type: "image/png" },
    ],
    apple: "/icons/apple-touch-icon.png",
  },
  // iOS ignores most of the manifest, so the home-screen app is set up here too
  appleWebApp: {
    capable: true,
    title: "Castingsport",
    statusBarStyle: "black",
  },
};

export const viewport: Viewport = {
  themeColor: "#030712", // gray-950: browser bar and installed app's title bar
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pl">
      <body className="bg-gray-950 text-gray-100 antialiased flex flex-col min-h-screen">
        <LangProvider>
          <div className="flex-1 pb-10">{children}</div>
          <footer className="fixed bottom-0 inset-x-0 z-40 text-center text-gray-600 text-xs py-3 bg-gray-950 border-t border-gray-900">
            Created by Dawid Witczak
            <FooterSettings />
          </footer>
        </LangProvider>
      </body>
    </html>
  );
}
