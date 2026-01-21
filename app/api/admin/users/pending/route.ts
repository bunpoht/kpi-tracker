import { type NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/lib/db"
import { verifyToken } from "@/lib/auth"
import { cookies } from "next/headers"

export async function GET(request: NextRequest) {
  console.log("[v0] GET /api/admin/users/pending called")
  try {
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

    const supabase = createServerClient()
    const { data: users, error } = await supabase
      .from("Users")
      .select("id, email, name, status, createdAt")
      .eq("status", "PENDING")
      .order("createdAt", { ascending: false })

    console.log("[v0] Pending users query - data:", users, "error:", error)

    if (error) throw error

    return NextResponse.json({ users: users || [] })
  } catch (error) {
    console.error("[v0] Error fetching pending users:", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}
