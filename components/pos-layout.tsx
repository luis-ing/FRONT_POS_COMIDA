"use client"

import { AppSidebar } from "@/components/app-sidebar"
import { useAuth } from "@/lib/auth-context"
import { Spinner } from "@/components/ui/spinner"

interface POSLayoutProps {
  children: React.ReactNode
}

export function POSLayout({ children }: POSLayoutProps) {
  const { isLoading, isAuthenticated } = useAuth()

  // Show loading state while checking auth
  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <Spinner className="h-8 w-8 text-primary" />
          <p className="text-sm text-muted-foreground">Cargando...</p>
        </div>
      </div>
    )
  }

  // Don't render layout if not authenticated (redirect will happen)
  if (!isAuthenticated) {
    return null
  }

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <AppSidebar />
      <main className="flex-1 overflow-auto">{children}</main>
    </div>
  )
}
