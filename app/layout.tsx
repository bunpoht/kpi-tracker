import "./globals.css"
import { Prompt } from "next/font/google"
import { AuthProvider } from "./context/AuthContext"
import { ThemeProvider } from "./context/ThemeContext"


const prompt = Prompt({
  weight: ["100", "200", "300", "400", "500", "600", "700", "800", "900"],
  subsets: ["latin", "thai"],
  variable: "--font-prompt",
  display: "swap",
})

export const metadata = {
  title: "DCC KPI Tracker",
  description: "Track your KPIs efficiently",
}

import { AppShell } from "@/components/app-shell"

// ... (imports are fine, but I need to remove Sidebar import if I can, but replace_file_content is specific)

import { createClient } from "@/lib/db"

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const { data: settings } = await supabase.from("Settings").select("*").eq("key", "globalTheme").single()
  const globalTheme = (settings?.value as "light" | "violet") || "light"

  return (
    <html lang="en" className={globalTheme} data-theme={globalTheme}>
      <body className={`${prompt.variable} font-sans antialiased bg-background text-foreground`}>
        <AuthProvider>
          <ThemeProvider forcedTheme={globalTheme}>
            <AppShell>
              {children}
            </AppShell>
          </ThemeProvider>
        </AuthProvider>
      </body>
    </html>
  )
}
