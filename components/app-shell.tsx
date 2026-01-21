"use client"

import { useState, useEffect } from "react"
import { Sidebar } from "@/components/sidebar"

export function AppShell({ children }: { children: React.ReactNode }) {
    const [isCollapsed, setIsCollapsed] = useState(false)
    const [isMobile, setIsMobile] = useState(false)

    // Handle responsive behavior
    useEffect(() => {
        const checkMobile = () => {
            setIsMobile(window.innerWidth < 768)
            if (window.innerWidth < 768) {
                setIsCollapsed(true)
            }
        }

        checkMobile()
        window.addEventListener("resize", checkMobile)
        return () => window.removeEventListener("resize", checkMobile)
    }, [])

    return (
        <div className="flex min-h-screen bg-background">
            <Sidebar
                isCollapsed={isCollapsed}
                toggleSidebar={() => setIsCollapsed(!isCollapsed)}
                isMobile={isMobile}
            />
            <main
                className={`flex-1 transition-all duration-300 ease-in-out w-full ${isCollapsed ? 'md:pl-20' : 'md:pl-64'
                    } ${isMobile ? 'pl-0' : ''}`}
            >
                {children}
            </main>
        </div>
    )
}
