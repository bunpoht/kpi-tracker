import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/db"
import { cookies } from "next/headers"
import { verifyToken } from "@/lib/auth"

export async function GET(request: NextRequest) {
    try {
        const cookieStore = await cookies()
        const token = cookieStore.get("token")?.value
        let user = null

        if (token) {
            const payload = await verifyToken(token)
            if (payload) {
                user = payload
            }
        }

        const supabase = await createClient()

        // Fetch settings to check if hidden cards should be shown
        const { data: settings } = await supabase
            .from("Settings")
            .select("value")
            .eq("key", "showHiddenCards")
            .single()

        const showHiddenCards = settings?.value === "true"
        const shouldShowHidden = !!user && showHiddenCards

        let goalsQuery = supabase
            .from("Goals")
            // Select only necessary fields for navigation
            .select("id, title, displayOrder, isVisible")
            .order("displayOrder", { ascending: true })

        if (!shouldShowHidden) {
            goalsQuery = goalsQuery.eq("isVisible", true)
        }

        const { data: goals, error } = await goalsQuery

        if (error) {
            console.error("Error fetching goals list:", error)
            return NextResponse.json({ message: "Failed to fetch goals" }, { status: 500 })
        }

        return NextResponse.json({ goals: goals || [] })
    } catch (error) {
        console.error("Error in goals list API:", error)
        return NextResponse.json({ message: "Internal server error" }, { status: 500 })
    }
}
