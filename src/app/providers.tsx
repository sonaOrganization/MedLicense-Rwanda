"use client";
import { SessionProvider } from "next-auth/react";
import { ThemeProvider } from "next-themes";
import { Toaster } from "react-hot-toast";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
        {children}
        <Toaster
          position="top-right"
          toastOptions={{
            className: "dark:bg-gray-800 dark:text-white",
            duration: 4000,
            style: { borderRadius: "10px" },
          }}
        />
      </ThemeProvider>
    </SessionProvider>
  );
}
