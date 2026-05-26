"use client";
import { SessionProvider } from "next-auth/react";
import { Toaster } from "react-hot-toast";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      {children}
      <Toaster
        position="top-right"
        toastOptions={{
          className: "dark:bg-gray-800 dark:text-white",
          duration: 4000,
          style: { borderRadius: "10px" },
        }}
      />
    </SessionProvider>
  );
}
