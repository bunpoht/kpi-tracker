import { type NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"
import { createServerClient } from "@/lib/db"
import { verifyToken } from "@/lib/auth"

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    console.log("[v0] Approve user route called")

    const { id } = await params
    console.log("[v0] User ID to approve:", id)

    const cookieStore = await cookies()
    const token = cookieStore.get("token")?.value

    console.log("[v0] Token present:", !!token)

    if (!token) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    const payload = await verifyToken(token)
    console.log("[v0] Token payload:", payload)

    if (!payload || payload.role !== "ADMIN") {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 })
    }

    const userId = Number.parseInt(id)
    const supabase = createServerClient()

    // Get user email before updating
    const { data: user, error: fetchError } = await supabase
      .from("Users")
      .select("email, name")
      .eq("id", userId)
      .single()

    console.log("[v0] User to approve:", user, "error:", fetchError)

    // Update user status
    const { error } = await supabase.from("Users").update({ status: "APPROVED" }).eq("id", userId)

    if (error) {
      console.error("[v0] Error updating user status:", error)
      throw error
    }

    console.log("[v0] User approved successfully:", user?.email)

    // TODO: Send email notification to user
    // For now, just log it
    console.log(`User approved: ${user?.email}`)

    return NextResponse.json({
      message: "อนุมัติผู้ใช้สำเร็จ",
      email: user?.email,
    })
  } catch (error) {
    console.error("[v0] Error approving user:", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}
