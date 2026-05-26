import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Castingsport Wyniki",
  description: "Wyniki zawodów castingsport",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pl">
      <body className="bg-gray-950 text-gray-100 antialiased flex flex-col min-h-screen">
        <div className="flex-1 pb-10">{children}</div>
        <footer className="fixed bottom-0 inset-x-0 text-center text-gray-600 text-xs py-3 bg-gray-950 border-t border-gray-900">
          Created by Dawid Witczak
        </footer>
      </body>
    </html>
  );
}
