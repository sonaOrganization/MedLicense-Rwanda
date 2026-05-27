import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import { ThemeProvider } from "@/lib/theme";
import "./globals.css";
import { Providers } from "./providers";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
  title: {
    default: "RMDC Exam Prep – Professional Medical License Preparation",
    template: "%s | RMDC Exam Prep",
  },
  description:
    "Rwanda's leading platform for professional medical license (RMDC) exam preparation. Practice with real exam simulations, video tutorials, and analytics.",
  keywords: ["RMDC", "Rwanda Medical", "License Exam", "Medical Prep", "Exam Simulation"],
  authors: [{ name: "RMDC Exam Prep" }],
  openGraph: {
    type: "website",
    locale: "en_US",
    siteName: "RMDC Exam Prep",
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0f0f0f" },
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={inter.variable} suppressHydrationWarning>
      <body className="min-h-screen bg-white dark:bg-gray-950 text-gray-900 dark:text-gray-100 antialiased" suppressHydrationWarning>
        <ThemeProvider>
          <Providers>{children}</Providers>
        </ThemeProvider>
      </body>
    </html>
  );
}
