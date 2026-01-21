import { type NextRequest, NextResponse } from "next/server"
import { verifyToken } from "@/lib/auth"
import { createServerClient } from "@/lib/db"
import { cookies } from "next/headers"

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    console.log("[v0] PATCH /api/goals/${params.id}/visibility - Starting")

    const cookieStore = await cookies()
    const token = cookieStore.get("token")?.value

    if (!token) {
      console.log("[v0] No token found")
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    const decoded = await verifyToken(token)
    console.log("[v0] Token decoded, user role:", decoded?.role)

    if (!decoded || decoded.role !== "ADMIN") {
      console.log("[v0] User is not admin")
      return NextResponse.json({ message: "Forbidden" }, { status: 403 })
    }

    const { isVisible } = await request.json()
    console.log("[v0] Updating goal ${params.id} visibility to:", isVisible)

    const supabase = createServerClient()

    const { error } = await supabase.from("Goals").update({ isVisible }).eq("id", params.id)

    if (error) {
      console.error("[v0] Database error:", error)
      return NextResponse.json({ message: "Failed to update visibility" }, { status: 500 })
    }

    console.log("[v0] Visibility updated successfully")
    return NextResponse.json({ message: "Visibility updated successfully" })
  } catch (error) {
    console.error("[v0] Error updating goal visibility:", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}
