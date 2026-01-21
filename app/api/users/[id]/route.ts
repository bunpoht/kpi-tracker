import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/db"
import { cookies } from "next/headers"
import { verifyToken } from "@/lib/auth"
import bcrypt from "bcryptjs"

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get("token")?.value

    if (!token) {
      return NextResponse.json({ message: "Not authenticated" }, { status: 401 })
    }

    const decoded = await verifyToken(token)
    if (!decoded || decoded.role !== "ADMIN") {
      return NextResponse.json({ message: "Unauthorized" }, { status: 403 })
    }

    const userId = Number.parseInt(params.id)

    // Prevent deleting yourself
    if (decoded.id === userId) {
      return NextResponse.json({ message: "Cannot delete your own account" }, { status: 400 })
    }

    const supabase = await createClient()

    const { error } = await supabase.from("Users").delete().eq("id", userId)

    if (error) throw error

    return NextResponse.json({ message: "User deleted successfully" }, { status: 200 })
  } catch (error) {
    console.error("Delete user error:", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get("token")?.value

    if (!token) {
      return NextResponse.json({ message: "Not authenticated" }, { status: 401 })
    }

    const decoded = await verifyToken(token)
    if (!decoded || decoded.role !== "ADMIN") {
      return NextResponse.json({ message: "Unauthorized" }, { status: 403 })
    }

    const userId = Number.parseInt(params.id)
    const { password, role } = await request.json()

    if (!password && !role) {
      return NextResponse.json({ message: "Password or role is required" }, { status: 400 })
    }

    if (role && !["USER", "ADMIN"].includes(role)) {
      return NextResponse.json({ message: "Invalid role" }, { status: 400 })
    }

    const supabase = await createClient()

    const updateData: { password?: string; role?: string } = {}

    if (password) {
      updateData.password = await bcrypt.hash(password, 10)
    }

    if (role) {
      if (decoded.id === userId) {
        return NextResponse.json({ message: "Cannot change your own role" }, { status: 400 })
      }
      updateData.role = role
    }

    const { error } = await supabase.from("Users").update(updateData).eq("id", userId)

    if (error) throw error

    const message =
      password && role
        ? "Password and role updated successfully"
        : password
          ? "Password updated successfully"
          : "Role updated successfully"

    return NextResponse.json({ message }, { status: 200 })
  } catch (error) {
    console.error("Update user error:", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}
