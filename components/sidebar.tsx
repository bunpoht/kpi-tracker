"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
    LayoutGrid,
    FileText,
    ListFilter,
    Users,
    User,
    UserCog,
    UserCheck,
    Settings,
    LogOut,
    LogIn,
    Search,
    ChevronLeft,
    ChevronRight
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useAuth } from "@/app/context/AuthContext"

interface SidebarProps {
    isCollapsed: boolean
    toggleSidebar: () => void
    isMobile?: boolean
}

export function Sidebar({
    isCollapsed,
    toggleSidebar,
    isMobile = false
}: SidebarProps) {
    const pathname = usePathname()
    const { user } = useAuth()

    return (
        <div
            className={`fixed left-0 top-0 z-40 h-screen bg-card border-r border-border transition-all duration-300 ease-in-out flex flex-col ${isCollapsed ? "w-20" : "w-64"
                } ${isMobile && !isCollapsed ? "translate-x-0" : ""} ${isMobile && isCollapsed ? "-translate-x-full" : ""
                }`}
        >
            {/* Header */}
            <div className={`h-16 flex items-center px-4 border-b border-border/40 ${isCollapsed ? 'justify-center' : 'justify-between'} relative`}>
                <Link href="/" className="flex items-center gap-2 overflow-hidden">
                    <div className="w-8 h-8 rounded-lg bg-primary flex-shrink-0 flex items-center justify-center">
                        <span className="text-primary-foreground font-bold text-lg">K</span>
                    </div>
                    {!isCollapsed && (
                        <span className="font-bold text-xl font-prompt text-foreground whitespace-nowrap">KPI Tracker</span>
                    )}
                </Link>

                {/* Toggle Button */}
                {!isMobile && (
                    <Button
                        onClick={toggleSidebar}
                        variant="ghost"
                        size="icon"
                        className="absolute -right-3 top-1/2 -translate-y-1/2 h-6 w-6 rounded-full border border-border bg-background shadow-sm hover:bg-accent text-muted-foreground z-50 hidden md:flex"
                    >
                        {isCollapsed ? <ChevronRight className="h-3 w-3" /> : <ChevronLeft className="h-3 w-3" />}
                    </Button>
                )}
            </div>

            {/* Search */}
            {!isCollapsed && (
                <div className="p-4 pb-2">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <input
                            type="text"
                            placeholder="Search"
                            className="w-full h-10 pl-9 pr-4 rounded-lg bg-secondary/50 border-none text-sm font-prompt focus:ring-1 focus:ring-primary outline-none transition-all"
                        />
                        <div className="absolute right-3 top-1/2 -translate-y-1/2 flex gap-1">
                            <span className="text-[10px] text-muted-foreground border border-border rounded px-1">⌘</span>
                            <span className="text-[10px] text-muted-foreground border border-border rounded px-1">K</span>
                        </div>
                    </div>
                </div>
            )}

            {/* Navigation */}
            <ScrollArea className="flex-1 px-2">
                <div className="space-y-1 pt-2">
                    {!isCollapsed && <p className="px-2 text-xs font-medium text-muted-foreground mb-2 font-prompt">Menu</p>}

                    {user && (
                        <>
                            <Link href="/">
                                <Button
                                    variant="ghost"
                                    className={`w-full justify-start gap-3 font-prompt mb-1 h-11 rounded-lg transition-all duration-200 ${pathname === "/"
                                        ? "bg-orange-50 text-primary hover:bg-orange-100 hover:text-primary font-medium shadow-sm border border-orange-100/50"
                                        : "text-muted-foreground hover:bg-secondary/80 hover:text-foreground"
                                        } ${isCollapsed ? 'justify-center px-0' : ''}`}
                                    title={isCollapsed ? "แดชบอร์ด" : ""}
                                >
                                    <LayoutGrid className={`w-5 h-5 flex-shrink-0 ${pathname === "/" ? "text-primary" : "text-muted-foreground"}`} />
                                    {!isCollapsed && <span>แดชบอร์ด</span>}
                                </Button>
                            </Link>

                            <Link href="/dashboard">
                                <Button
                                    variant="ghost"
                                    className={`w-full justify-start gap-3 font-prompt mb-1 h-11 rounded-lg transition-all duration-200 ${pathname === "/dashboard"
                                        ? "bg-orange-50 text-primary hover:bg-orange-100 hover:text-primary font-medium shadow-sm border border-orange-100/50"
                                        : "text-muted-foreground hover:bg-secondary/80 hover:text-foreground"
                                        } ${isCollapsed ? 'justify-center px-0' : ''}`}
                                    title={isCollapsed ? "บันทึกผลงาน" : ""}
                                >
                                    <FileText className={`w-5 h-5 flex-shrink-0 ${pathname === "/dashboard" ? "text-primary" : "text-muted-foreground"}`} />
                                    {!isCollapsed && <span>บันทึกผลงาน</span>}
                                </Button>
                            </Link>

                            <Link href="/goals">
                                <Button
                                    variant="ghost"
                                    className={`w-full justify-start gap-3 font-prompt mb-1 h-11 rounded-lg transition-all duration-200 ${pathname === "/goals"
                                        ? "bg-orange-50 text-primary hover:bg-orange-100 hover:text-primary font-medium shadow-sm border border-orange-100/50"
                                        : "text-muted-foreground hover:bg-secondary/80 hover:text-foreground"
                                        } ${isCollapsed ? 'justify-center px-0' : ''}`}
                                    title={isCollapsed ? "เป้าหมาย" : ""}
                                >
                                    <ListFilter className={`w-5 h-5 flex-shrink-0 ${pathname === "/goals" ? "text-primary" : "text-muted-foreground"}`} />
                                    {!isCollapsed && <span>เป้าหมาย</span>}
                                </Button>
                            </Link>

                            <Link href="/dashboard/users">
                                <Button
                                    variant="ghost"
                                    className={`w-full justify-start gap-3 font-prompt mb-1 h-11 rounded-lg transition-all duration-200 ${pathname === "/dashboard/users"
                                        ? "bg-orange-50 text-primary hover:bg-orange-100 hover:text-primary font-medium shadow-sm border border-orange-100/50"
                                        : "text-muted-foreground hover:bg-secondary/80 hover:text-foreground"
                                        } ${isCollapsed ? 'justify-center px-0' : ''}`}
                                    title={isCollapsed ? "ติดตามรายบุคคล" : ""}
                                >
                                    <Users className={`w-5 h-5 flex-shrink-0 ${pathname === "/dashboard/users" ? "text-primary" : "text-muted-foreground"}`} />
                                    {!isCollapsed && <span>ติดตามรายบุคคล</span>}
                                </Button>
                            </Link>

                            <Link href="/profile">
                                <Button
                                    variant="ghost"
                                    className={`w-full justify-start gap-3 font-prompt mb-1 h-11 rounded-lg transition-all duration-200 ${pathname === "/profile"
                                        ? "bg-orange-50 text-primary hover:bg-orange-100 hover:text-primary font-medium shadow-sm border border-orange-100/50"
                                        : "text-muted-foreground hover:bg-secondary/80 hover:text-foreground"
                                        } ${isCollapsed ? 'justify-center px-0' : ''}`}
                                    title={isCollapsed ? "โปรไฟล์" : ""}
                                >
                                    <User className={`w-5 h-5 flex-shrink-0 ${pathname === "/profile" ? "text-primary" : "text-muted-foreground"}`} />
                                    {!isCollapsed && <span>โปรไฟล์</span>}
                                </Button>
                            </Link>
                        </>
                    )}

                    {/* Admin Section */}
                    {user?.role === 'ADMIN' && (
                        <>
                            <div className="my-2 border-t border-border/40" />
                            {!isCollapsed && <p className="px-2 text-xs font-medium text-muted-foreground mb-2 font-prompt">Admin</p>}

                            <Link href="/admin/manage-users">
                                <Button
                                    variant="ghost"
                                    className={`w-full justify-start gap-3 font-prompt mb-1 h-11 rounded-lg transition-all duration-200 ${pathname === "/admin/manage-users"
                                        ? "bg-orange-50 text-primary hover:bg-orange-100 hover:text-primary font-medium shadow-sm border border-orange-100/50"
                                        : "text-muted-foreground hover:bg-secondary/80 hover:text-foreground"
                                        } ${isCollapsed ? 'justify-center px-0' : ''}`}
                                    title={isCollapsed ? "จัดการผู้ใช้" : ""}
                                >
                                    <UserCog className={`w-5 h-5 flex-shrink-0 ${pathname === "/admin/manage-users" ? "text-primary" : "text-muted-foreground"}`} />
                                    {!isCollapsed && <span>จัดการผู้ใช้</span>}
                                </Button>
                            </Link>

                            <Link href="/admin/users">
                                <Button
                                    variant="ghost"
                                    className={`w-full justify-start gap-3 font-prompt mb-1 h-11 rounded-lg transition-all duration-200 ${pathname === "/admin/users"
                                        ? "bg-orange-50 text-primary hover:bg-orange-100 hover:text-primary font-medium shadow-sm border border-orange-100/50"
                                        : "text-muted-foreground hover:bg-secondary/80 hover:text-foreground"
                                        } ${isCollapsed ? 'justify-center px-0' : ''}`}
                                    title={isCollapsed ? "อนุมัติผู้ใช้" : ""}
                                >
                                    <UserCheck className={`w-5 h-5 flex-shrink-0 ${pathname === "/admin/users" ? "text-primary" : "text-muted-foreground"}`} />
                                    {!isCollapsed && <span>อนุมัติผู้ใช้</span>}
                                </Button>
                            </Link>

                            <Link href="/admin/settings">
                                <Button
                                    variant="ghost"
                                    className={`w-full justify-start gap-3 font-prompt mb-1 h-11 rounded-lg transition-all duration-200 ${pathname === "/admin/settings"
                                        ? "bg-orange-50 text-primary hover:bg-orange-100 hover:text-primary font-medium shadow-sm border border-orange-100/50"
                                        : "text-muted-foreground hover:bg-secondary/80 hover:text-foreground"
                                        } ${isCollapsed ? 'justify-center px-0' : ''}`}
                                    title={isCollapsed ? "ตั้งค่าระบบ" : ""}
                                >
                                    <Settings className={`w-5 h-5 flex-shrink-0 ${pathname === "/admin/settings" ? "text-primary" : "text-muted-foreground"}`} />
                                    {!isCollapsed && <span>ตั้งค่าระบบ</span>}
                                </Button>
                            </Link>
                        </>
                    )}
                </div>
            </ScrollArea>

            {/* User Profile (Bottom) */}
            <div className="p-4 border-t border-border/40">
                {user ? (
                    <div className={`flex items-center ${isCollapsed ? 'justify-center' : 'gap-3'} p-2 rounded-xl hover:bg-secondary/50 transition-colors cursor-pointer group relative`}>
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-orange-400 flex-shrink-0 flex items-center justify-center text-white font-bold shadow-sm">
                            {user.name.charAt(0)}
                        </div>
                        {!isCollapsed && (
                            <>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium font-prompt truncate text-foreground">{user.name}</p>
                                    <p className="text-xs text-muted-foreground truncate font-prompt">{user.role || "User"}</p>
                                </div>
                                <div className="flex items-center gap-1">
                                    <LogOut
                                        className="w-4 h-4 text-muted-foreground hover:text-destructive transition-colors cursor-pointer"
                                        onClick={async (e) => {
                                            e.stopPropagation()
                                            try {
                                                await fetch("/api/auth/logout", { method: "POST" })
                                                window.location.reload()
                                            } catch (error) {
                                                console.error("Logout failed:", error)
                                                window.location.reload()
                                            }
                                        }}
                                    />
                                </div>
                            </>
                        )}
                        {isCollapsed && (
                            <div className="absolute left-full ml-2 hidden group-hover:flex bg-popover border border-border rounded-lg p-2 shadow-lg flex-col gap-2 z-50">
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 text-muted-foreground hover:text-destructive"
                                    onClick={async (e) => {
                                        e.stopPropagation()
                                        try {
                                            await fetch("/api/auth/logout", { method: "POST" })
                                            window.location.reload()
                                        } catch (error) {
                                            console.error("Logout failed:", error)
                                            window.location.reload()
                                        }
                                    }}
                                    title="Logout"
                                >
                                    <LogOut className="w-4 h-4" />
                                </Button>
                            </div>
                        )}
                    </div>
                ) : (
                    <Link href="/login">
                        <Button className={`w-full font-prompt rounded-xl ${isCollapsed ? 'px-0' : ''}`}>
                            {isCollapsed ? <LogIn className="w-5 h-5" /> : "Sign In"}
                        </Button>
                    </Link>
                )}
            </div>
        </div>
    )
}
