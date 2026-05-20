import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import ReduxProvider from "@/components/ReduxProvider";
import ToastProvider from "@/components/common/ToastProvider";
import AppShell from "@/components/AppShell";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
  title: "Sentra — Code Risk Intelligence",
  description: "Pull-request risk analysis and repository context management platform.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className={`${inter.variable} font-[var(--font-inter,system-ui,sans-serif)] antialiased bg-[#f8f9fb] text-gray-900`}>
        <ReduxProvider>
          <ToastProvider />
          <AppShell>{children}</AppShell>
        </ReduxProvider>
      </body>
    </html>
  );
}
