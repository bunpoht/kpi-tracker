import { type NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/lib/db"
import { verifyToken } from "@/lib/auth"

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const token = request.cookies.get("token")?.value
    if (!token) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    const payload = await verifyToken(token)
    if (!payload || payload.role !== "ADMIN") {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 })
    }

    const userId = Number.parseInt(params.id)
    const supabase = createServerClient()

    const { error } = await supabase.from("Users").update({ status: "REJECTED" }).eq("id", userId)

    if (error) throw error

    return NextResponse.json({ message: "ปฏิเสธผู้ใช้สำเร็จ" })
  } catch (error) {
    console.error("Error rejecting user:", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}
