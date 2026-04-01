"use client"

import { ThemeProvider } from "@/components/theme-provider"

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="light"
      enableSystem
      disableTransitionOnChange
    >
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        {children}
      </div>
    </ThemeProvider>
  )
}
