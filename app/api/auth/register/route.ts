import { type NextRequest, NextResponse } from "next/server"
import { createUser } from "@/lib/auth"
import { createServerClient } from "@/lib/db"

export async function POST(request: NextRequest) {
  try {
    const { email, password, name } = await request.json()

    if (!email || !password || !name) {
      return NextResponse.json({ message: "All fields are required" }, { status: 400 })
    }

    if (password.length < 6) {
      return NextResponse.json({ message: "Password must be at least 6 characters" }, { status: 400 })
    }

    const supabase = createServerClient()
    const { data: settings } = await supabase.from("Settings").select("value").eq("key", "isRegistrationOpen").single()

    if (settings && settings.value === "false") {
      return NextResponse.json(
        {
          message: "การสมัครสมาชิกถูกปิดชั่วคราว กรุณาลองใหม่ภายหลัง",
        },
        { status: 403 },
      )
    }

    const user = await createUser(email, password, name)

    const { password: _, ...userWithoutPassword } = user
    return NextResponse.json({
      user: userWithoutPassword,
      message: "สมัครสมาชิกสำเร็จ กรุณารอการอนุมัติจากผู้ดูแลระบบ",
    })
  } catch (error: any) {
    console.error("Registration error:", error)
    if (error.message.includes("duplicate") || error.message.includes("unique")) {
      return NextResponse.json({ message: "อีเมลนี้ถูกใช้งานแล้ว" }, { status: 409 })
    }
    return NextResponse.json({ message: "เกิดข้อผิดพลาดในระบบ" }, { status: 500 })
  }
}
