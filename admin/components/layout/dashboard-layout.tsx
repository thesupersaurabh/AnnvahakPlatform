"use client"

import type React from "react"

import { useAuth } from "@/contexts/auth-context"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { Header } from "./header"
import { Sidebar } from "./sidebar"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, isLoading, logout } = useAuth()
  const router = useRouter()
  const [accessDenied, setAccessDenied] = useState(false)
  const [isSidebarOpen, setIsSidebarOpen] = useState(true)

  const toggleSidebar = () => {
    const newState = !isSidebarOpen;
    setIsSidebarOpen(newState);
    // Immediately save to localStorage to ensure it's available for any navigation
    localStorage.setItem('sidebarOpen', newState.toString());
  }

  // On first render, read sidebar state from localStorage
  useEffect(() => {
    const savedState = localStorage.getItem('sidebarOpen');
    // Only set if we have a saved value
    if (savedState !== null) {
      setIsSidebarOpen(savedState === 'true');
    }
    // We don't need to save on unmount because toggleSidebar handles it
  }, []); // Empty dependency array means this only runs once on mount

  useEffect(() => {
    if (!isLoading) {
      if (!user) {
        // Not logged in, redirect to login
        router.push("/login")
      } else if (user.role !== "admin") {
        // Logged in but not admin, show access denied
        setAccessDenied(true)
      }
    }
  }, [user, isLoading, router])

  if (isLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-gradient-to-b from-white to-purple-50 dark:from-slate-900 dark:to-slate-950">
        <div className="flex flex-col items-center gap-4">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-purple-600 border-t-transparent"></div>
          <p className="text-sm font-medium text-slate-600 dark:text-slate-300">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  if (accessDenied) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-gradient-to-b from-white to-purple-50 dark:from-slate-900 dark:to-slate-950">
        <div className="w-full max-w-md p-8 bg-white dark:bg-slate-900 rounded-xl shadow-lg">
          <div className="flex items-center justify-center mb-6">
            <span className="text-3xl font-bold text-purple-600 dark:text-purple-400">Annvahak</span>
          </div>
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-5 w-5" />
            <AlertTitle className="text-lg font-semibold">Access Denied</AlertTitle>
            <AlertDescription className="mt-2">
              This dashboard is only accessible to administrators. 
              Your current role does not have permission to access this area.
            </AlertDescription>
          </Alert>
          <div className="flex justify-end space-x-4">
            <Button variant="outline" onClick={() => router.push("/")} className="hover:bg-slate-100 dark:hover:bg-slate-800">
              Go to Homepage
            </Button>
            <Button 
              className="bg-red-600 hover:bg-red-700 dark:bg-red-700 dark:hover:bg-red-800" 
              onClick={() => {
                logout()
                router.push("/login")
              }}
            >
              Log Out
            </Button>
          </div>
        </div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  return (
    <div className="min-h-screen overflow-hidden bg-gradient-to-br from-white to-purple-50 dark:from-slate-900 dark:to-slate-950 dark:text-slate-50">
      <div 
        className={`hidden md:flex h-full flex-col fixed inset-y-0 z-50 transition-all duration-300 ease-in-out ${
          isSidebarOpen ? 'w-72' : 'w-20'
        }`}
      >
        <Sidebar collapsed={!isSidebarOpen} />
      </div>
      <div 
        className={`transition-all duration-300 ease-in-out ${
          isSidebarOpen ? 'md:pl-72' : 'md:pl-20'
        } flex flex-col min-h-screen`}
      >
        <div className="fixed top-0 right-0 left-0 z-40 md:left-auto" style={{ 
          left: isSidebarOpen ? '18rem' : '5rem',
          transition: 'left 0.3s ease-in-out'
        }}>
          <Header isSidebarOpen={isSidebarOpen} toggleSidebar={toggleSidebar} />
        </div>
        <main className="flex-1 overflow-y-auto px-4 py-6 md:px-8 md:py-8 mt-16">{children}</main>
        <footer className="py-4 px-6 text-center text-sm text-slate-500 dark:text-slate-400 border-t border-slate-200 dark:border-slate-800">
          <p>© {new Date().getFullYear()} Annvahak Platform. All rights reserved.</p>
        </footer>
      </div>
    </div>
  )
}

