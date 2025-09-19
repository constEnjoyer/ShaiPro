"use client"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { Calendar, CheckSquare, BarChart3, Settings, Mic, Users, FileText } from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"

const navigation = [
  { name: "Встречи", icon: Calendar, href: "/meetings" },
  { name: "Задачи", icon: CheckSquare, href: "/tasks" },
  { name: "Записи", icon: Mic, href: "/recordings" },
  { name: "Команда", icon: Users, href: "/team" },
  { name: "Отчеты", icon: BarChart3, href: "/analytics" },
  { name: "Документы", icon: FileText, href: "/documents" },
  { name: "Настройки", icon: Settings, href: "/settings" },
]

export function Sidebar() {
  const pathname = usePathname()

  return (
    <div className="w-64 bg-sidebar border-r border-sidebar-border flex flex-col">
      {/* Logo */}
      <div className="p-6 border-b border-sidebar-border">
        <Link href="/" className="flex items-center gap-3">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
            <Mic className="w-4 h-4 text-primary-foreground" />
          </div>
          <div>
            <h1 className="font-semibold text-sidebar-foreground">AI Meeting Agent</h1>
            <p className="text-xs text-muted-foreground">Умный помощник</p>
          </div>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-2">
        {navigation.map((item) => {
          const isActive = pathname === item.href
          return (
            <Link key={item.name} href={item.href}>
              <Button
                variant={isActive ? "default" : "ghost"}
                className={cn(
                  "w-full justify-start gap-3 h-11",
                  isActive
                    ? "bg-primary text-primary-foreground hover:bg-primary/90"
                    : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                )}
              >
                <item.icon className="w-4 h-4" />
                {item.name}
              </Button>
            </Link>
          )
        })}
      </nav>

      {/* User Profile */}
      <div className="p-4 border-t border-sidebar-border">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-muted rounded-full flex items-center justify-center">
            <span className="text-sm font-medium text-muted-foreground">У</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-sidebar-foreground truncate">Пользователь</p>
            <p className="text-xs text-muted-foreground truncate">user@company.com</p>
          </div>
        </div>
      </div>
    </div>
  )
}
