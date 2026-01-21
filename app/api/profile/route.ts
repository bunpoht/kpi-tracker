import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/db"
import { cookies } from "next/headers"
import { verifyToken } from "@/lib/auth"
import bcrypt from "bcryptjs"

export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get("token")?.value

    if (!token) {
      return NextResponse.json({ message: "Not authenticated" }, { status: 401 })
    }

    const decoded = await verifyToken(token)
    if (!decoded) {
      return NextResponse.json({ message: "Invalid token" }, { status: 401 })
    }

    const supabase = await createClient()

    const { data: user, error } = await supabase
      .from("Users")
      .select("id, email, name, role, profilePicture, createdAt")
      .eq("id", decoded.id)
      .single()

    if (error) throw error

    return NextResponse.json({ user }, { status: 200 })
  } catch (error) {
    console.error("Get profile error:", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get("token")?.value

    if (!token) {
      return NextResponse.json({ message: "Not authenticated" }, { status: 401 })
    }

    const decoded = await verifyToken(token)
    if (!decoded) {
      return NextResponse.json({ message: "Invalid token" }, { status: 401 })
    }

    const { name, password, profilePicture } = await request.json()

    const supabase = await createClient()

    const updates: any = {}

    if (name) updates.name = name
    if (profilePicture !== undefined) updates.profilePicture = profilePicture
    if (password) {
      updates.password = await bcrypt.hash(password, 10)
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ message: "No fields to update" }, { status: 400 })
    }

    const { data: user, error } = await supabase
      .from("Users")
      .update(updates)
      .eq("id", decoded.id)
      .select("id, email, name, role, profilePicture, createdAt")
      .single()

    if (error) throw error

    return NextResponse.json({ user }, { status: 200 })
  } catch (error) {
    console.error("Update profile error:", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}
