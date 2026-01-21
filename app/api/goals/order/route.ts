import { type NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"
import { verifyToken } from "@/lib/auth"
import { createServerClient } from "@/lib/db"

export async function PUT(request: NextRequest) {
  console.log("[v0] PUT /api/goals/order called")

  try {
    const cookieStore = await cookies()
    const token = cookieStore.get("token")?.value
    console.log("[v0] Token exists:", !!token)

    if (!token) {
      console.log("[v0] No token found, returning 401")
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    const decoded = await verifyToken(token)
    console.log("[v0] Decoded token:", decoded)

    if (!decoded || decoded.role !== "ADMIN") {
      console.log("[v0] User is not ADMIN, returning 403")
      return NextResponse.json({ message: "Forbidden" }, { status: 403 })
    }

    const { goalOrders } = await request.json()

    console.log("[v0] Received goal orders to update:", goalOrders)

    const supabase = createServerClient()

    // Update each goal's display order
    for (const { id, displayOrder } of goalOrders) {
      console.log(`[v0] Updating goal ${id} to displayOrder ${displayOrder}`)
      const { error } = await supabase.from("Goals").update({ displayOrder }).eq("id", id)

      if (error) {
        console.error(`[v0] Error updating goal ${id}:`, error)
        throw error
      }
    }

    console.log("[v0] All goals updated successfully")
    return NextResponse.json({ message: "Order updated successfully" })
  } catch (error) {
    console.error("[v0] Error updating goal order:", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}
