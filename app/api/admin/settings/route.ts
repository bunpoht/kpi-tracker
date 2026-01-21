import { type NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/lib/db"
import { verifyToken } from "@/lib/auth"
import { cookies } from "next/headers"

export async function GET(request: NextRequest) {
  console.log("[v0] GET /api/admin/settings called")
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get("token")?.value
    console.log("[v0] Token present:", !!token)

    let isAdmin = false
    if (token) {
      const payload = await verifyToken(token)
      if (payload && payload.role === "ADMIN") {
        isAdmin = true
      }
    }

    const publicKeys = ["isRegistrationOpen"]
    const adminKeys = ["requireApproval", "showWorkLogTitle", "showWorkLogImages", "showWorkLogDescription", "showHiddenCards", "globalTheme"]

    const keysToFetch = isAdmin ? [...publicKeys, ...adminKeys] : publicKeys

    const supabase = createServerClient()
    const { data: settings, error } = await supabase.from("Settings").select("*").in("key", keysToFetch)

    console.log("[v0] Settings query result - data:", settings, "error:", error)

    if (error) throw error

    return NextResponse.json({ settings: settings || [] })
  } catch (error) {
    console.error("[v0] Error fetching settings:", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  console.log("[v0] PUT /api/admin/settings called")
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get("token")?.value

    if (!token) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    const payload = await verifyToken(token)
    if (!payload || payload.role !== "ADMIN") {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 })
    }

    const { key, value } = await request.json()
    console.log("[v0] Updating setting - key:", key, "value:", value)

    const supabase = createServerClient()

    const { error } = await supabase
      .from("Settings")
      .upsert({ key, value, updatedAt: new Date().toISOString() }, { onConflict: "key" })

    console.log("[v0] Update result - error:", error)

    if (error) throw error

    return NextResponse.json({ message: "อัปเดตการตั้งค่าสำเร็จ" })
  } catch (error) {
    console.error("[v0] Error updating settings:", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}
