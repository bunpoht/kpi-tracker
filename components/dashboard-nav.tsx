"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useAuth } from "@/app/context/AuthContext"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"
import { LogOut, User, BarChart3, Target, Users, Home, UserCog, UserCheck, Settings, MoreVertical } from "lucide-react"

export function DashboardNav() {
  const pathname = usePathname()
  const { user, logout } = useAuth()

  const mainNavItems = [
    { href: "/", label: "หน้าแสดงผล", icon: Home, roles: ["USER", "ADMIN"] },
    { href: "/dashboard", label: "บันทึกผลงาน", icon: BarChart3, roles: ["USER", "ADMIN"] },
    { href: "/goals", label: "เป้าหมาย", icon: Target, roles: ["USER", "ADMIN"] },
    { href: "/dashboard/users", label: "ติดตามรายบุคคล", icon: Users, roles: ["USER", "ADMIN"] },
    { href: "/profile", label: "โปรไฟล์", icon: User, roles: ["USER", "ADMIN"] },
  ]

  const adminNavItems = [
    { href: "/admin/manage-users", label: "จัดการผู้ใช้", icon: UserCog },
    { href: "/admin/users", label: "อนุมัติผู้ใช้", icon: UserCheck },
    { href: "/admin/settings", label: "ตั้งค่าระบบ", icon: Settings },
  ]

  const allNavItems = [...mainNavItems, ...adminNavItems.map((item) => ({ ...item, roles: ["ADMIN"] }))]

  const visibleMainNavItems = mainNavItems.filter((item) => user?.role && item.roles.includes(user.role))
  const visibleAllNavItems = allNavItems.filter((item) => user?.role && item.roles.includes(user.role))

  return (
    <nav className="border-b bg-card shadow-sm">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center gap-4 lg:gap-8">
            <Link href="/dashboard" className="text-lg md:text-xl font-bold text-primary font-prompt">
              KPI Tracker
            </Link>
            <div className="hidden lg:flex gap-6">
              {visibleAllNavItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "text-sm font-medium font-prompt transition-colors hover:text-primary",
                    pathname === item.href ? "text-primary border-b-2 border-primary pb-1" : "text-muted-foreground",
                  )}
                >
                  {item.label}
                </Link>
              ))}
            </div>
            <div className="flex lg:hidden gap-1">
              {visibleMainNavItems.map((item) => {
                const Icon = item.icon
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "p-2 rounded-lg transition-colors",
                      pathname === item.href
                        ? "text-primary bg-primary/10"
                        : "text-muted-foreground hover:text-primary hover:bg-primary/5",
                    )}
                    title={item.label}
                  >
                    <Icon className="w-5 h-5" />
                  </Link>
                )
              })}
              {user?.role === "ADMIN" && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className={cn(
                        "p-2 rounded-lg transition-colors",
                        ["/admin/manage-users", "/admin/users", "/admin/settings"].includes(pathname)
                          ? "text-primary bg-primary/10"
                          : "text-muted-foreground hover:text-primary hover:bg-primary/5",
                      )}
                      title="เมนูผู้ดูแลระบบ"
                    >
                      <MoreVertical className="w-5 h-5" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start" className="w-48">
                    {adminNavItems.map((item) => {
                      const Icon = item.icon
                      return (
                        <DropdownMenuItem key={item.href} asChild>
                          <Link
                            href={item.href}
                            className={cn(
                              "flex items-center gap-2 cursor-pointer font-prompt",
                              pathname === item.href && "text-primary bg-primary/10",
                            )}
                          >
                            <Icon className="w-4 h-4" />
                            {item.label}
                          </Link>
                        </DropdownMenuItem>
                      )
                    })}
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2 md:gap-3">
            <div className="hidden lg:flex items-center gap-2 text-sm text-muted-foreground">
              <User className="w-4 h-4" />
              <span className="font-prompt font-light">{user?.name}</span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={logout}
              className="font-prompt font-light text-muted-foreground hover:text-destructive hover:bg-destructive/10 p-2"
              title="ออกจากระบบ"
            >
              <LogOut className="w-4 h-4 lg:mr-1" />
              <span className="hidden lg:inline">ออกจากระบบ</span>
            </Button>
          </div>
        </div>
      </div>
    </nav>
  )
}
