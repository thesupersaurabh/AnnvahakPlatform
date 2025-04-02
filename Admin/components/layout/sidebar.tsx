"use client"

import { usePathname } from "next/navigation"
import Link from "next/link"
import { BarChart3, ListOrdered, LayoutDashboard, Settings, ShoppingCart, Users, MessageCircle } from "lucide-react"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

interface SidebarProps {
  collapsed?: boolean;
}

export function Sidebar({ collapsed = false }: SidebarProps) {
  const pathname = usePathname()

const routes = [
  {
      href: "/dashboard",
    label: "Dashboard",
      icon: <LayoutDashboard className="h-5 w-5" />,
      active: pathname === "/dashboard",
  },
  {
      href: "/users",
    label: "Users",
      icon: <Users className="h-5 w-5" />,
      active: pathname === "/users",
  },
  {
      href: "/products",
    label: "Products",
      icon: <ShoppingCart className="h-5 w-5" />,
      active: pathname === "/products",
  },
  {
      href: "/orders",
    label: "Orders",
      icon: <ListOrdered className="h-5 w-5" />,
      active: pathname === "/orders",
  },
  {
      href: "/messages",
    label: "Messages",
      icon: <MessageCircle className="h-5 w-5" />,
      active: pathname === "/messages",
    },
    {
      href: "/reports",
      label: "Reports",
      icon: <BarChart3 className="h-5 w-5" />,
      active: pathname === "/reports",
    },
    {
      href: "/settings",
      label: "Settings",
      icon: <Settings className="h-5 w-5" />,
      active: pathname === "/settings",
    },
  ]

  return (
    <div className="h-full flex flex-col border-r bg-white dark:bg-slate-950 dark:border-slate-800">
      <div className={cn(
        "p-6 border-b border-slate-100 dark:border-slate-800", 
        collapsed && "p-4"
      )}>
        <div className={cn(
          "flex flex-col items-center justify-center text-center",
          !collapsed && "mb-4"
        )}>
          <div className={cn(
            "bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-bold py-2 px-4 rounded-lg",
            collapsed ? "text-xl" : "text-2xl"
          )}>
            {collapsed ? "A" : "Annvahak"}
          </div>
          {!collapsed && (
            <Badge className="mt-2 bg-purple-100 text-purple-800 border-purple-200 hover:bg-purple-200 dark:bg-purple-900 dark:text-purple-200 dark:border-purple-800">
              Admin Portal
            </Badge>
          )}
        </div>
      </div>
      <div className="flex-1 overflow-y-auto py-4">
        <nav className="grid gap-1 px-2">
          {routes.map((route) => {
            return collapsed ? (
              <TooltipProvider key={route.href} delayDuration={200}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Link
                      href={route.href}
                      className={cn(
                        "flex items-center justify-center rounded-lg px-2 py-2 text-sm font-medium transition-colors",
                        route.active 
                          ? "bg-purple-100 text-purple-900 dark:bg-purple-900/20 dark:text-purple-100" 
                          : "hover:bg-purple-50 dark:hover:bg-slate-800"
                      )}
                      prefetch={false}
                    >
                      {route.icon}
        </Link>
                  </TooltipTrigger>
                  <TooltipContent side="right">
                    {route.label}
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            ) : (
            <Link
              key={route.href}
              href={route.href}
              className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                  route.active 
                    ? "bg-purple-100 text-purple-900 dark:bg-purple-900/20 dark:text-purple-100" 
                    : "hover:bg-purple-50 dark:hover:bg-slate-800"
                )}
                prefetch={false}
              >
                {route.icon}
                {route.label}
              </Link>
            );
          })}
        </nav>
      </div>
      {!collapsed && (
        <div className="p-4 border-t border-slate-100 dark:border-slate-800">
          <div className="text-xs text-center text-slate-500 dark:text-slate-400">
            © {new Date().getFullYear()} Annvahak Platform
              </div>
        </div>
      )}
    </div>
  )
}

