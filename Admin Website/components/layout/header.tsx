"use client"

import { useAuth } from "@/contexts/auth-context"
import { LayoutDashboard, LogOut, Menu, RefreshCw, Settings, User, PanelLeftClose, PanelLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet"
import { Sidebar } from "./sidebar"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { ThemeToggle } from "@/components/theme-toggle"
import Link from "next/link"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"

export function Header({ isSidebarOpen, toggleSidebar }: { isSidebarOpen: boolean; toggleSidebar: () => void }) {
  const { user, logout } = useAuth()
  const [isRefreshing, setIsRefreshing] = useState(false)
  const router = useRouter()

  const refreshPage = () => {
    setIsRefreshing(true)
    // Refresh the page
    router.refresh()
    // Reset refreshing state after a delay
    setTimeout(() => {
      setIsRefreshing(false)
    }, 1000)
  }

  const getUserInitials = () => {
    if (user?.full_name) {
      const nameParts = user.full_name.split(' ')
      if (nameParts.length > 1) {
        return `${nameParts[0][0]}${nameParts[nameParts.length - 1][0]}`.toUpperCase()
      }
      return user.full_name.substring(0, 2).toUpperCase()
    }
    return user?.username?.substring(0, 2).toUpperCase() || 'AD'
  }

  return (
    <header className="w-full z-40 border-b bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/80 dark:bg-slate-950/95 dark:supports-[backdrop-filter]:bg-slate-950/80 dark:border-slate-800">
      <div className="flex h-16 items-center justify-between px-4 md:px-6">
        <div className="flex items-center">
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden flex dark:text-slate-200 mr-2">
                <Menu className="h-5 w-5" />
                <span className="sr-only">Toggle menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="p-0">
              <SheetTitle className="sr-only">Navigation Menu</SheetTitle>
              <Sidebar />
            </SheetContent>
          </Sheet>
          <Button 
            variant="ghost" 
            size="icon" 
            className="hidden md:flex dark:text-slate-200 mr-2"
            onClick={toggleSidebar}
          >
            {isSidebarOpen ? (
              <PanelLeftClose className="h-5 w-5" />
            ) : (
              <PanelLeft className="h-5 w-5" />
            )}
            <span className="sr-only">
              {isSidebarOpen ? 'Hide sidebar' : 'Show sidebar'}
            </span>
          </Button>
        </div>
        <div className="flex items-center gap-3">
          <ThemeToggle />
          <Button 
            variant="ghost" 
            size="icon" 
            className="hover:bg-slate-100 dark:hover:bg-slate-800 dark:text-slate-200"
            onClick={refreshPage}
            disabled={isRefreshing}
            aria-label="Refresh page"
          >
            <RefreshCw className={`h-5 w-5 ${isRefreshing ? 'animate-spin' : ''}`} />
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="rounded-full h-9 px-2 gap-2 hover:bg-slate-100 dark:hover:bg-slate-800">
                <Avatar className="h-7 w-7 border border-slate-200 dark:border-slate-700">
                  <AvatarFallback className="bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300 text-xs font-medium">
                    {getUserInitials()}
                  </AvatarFallback>
                </Avatar>
                <span className="hidden sm:inline-block font-medium text-sm truncate max-w-[100px]">
                  {user?.full_name || user?.username}
                </span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium">{user?.full_name || user?.username}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">{user?.email}</p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <Link href="/dashboard">
                <DropdownMenuItem className="cursor-pointer">
                  <LayoutDashboard className="mr-2 h-4 w-4" />
                  <span>Dashboard</span>
                </DropdownMenuItem>
              </Link>
              <Link href="/settings">
                <DropdownMenuItem className="cursor-pointer">
                  <Settings className="mr-2 h-4 w-4" />
                  <span>Settings</span>
                </DropdownMenuItem>
              </Link>
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                onClick={logout} 
                className="text-red-500 dark:text-red-400 cursor-pointer focus:text-red-500 dark:focus:text-red-400"
              >
                <LogOut className="mr-2 h-4 w-4" />
                <span>Log out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  )
}

