import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/db"
import { jwtVerify } from "jose"
import { hash } from "bcryptjs"

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || "your-secret-key-change-in-production")

export async function POST(request: NextRequest) {
    try {
        const { token, password } = await request.json()

        if (!token || !password) {
            return NextResponse.json({ message: "Token and password are required" }, { status: 400 })
        }

        // Verify token
        let payload
        try {
            const verified = await jwtVerify(token, JWT_SECRET)
            payload = verified.payload
        } catch (err) {
            return NextResponse.json({ message: "Invalid or expired token" }, { status: 400 })
        }

        if (!payload || !payload.email || payload.type !== "reset") {
            return NextResponse.json({ message: "Invalid token payload" }, { status: 400 })
        }

        const email = payload.email as string

        // Hash new password
        const hashedPassword = await hash(password, 10)

        const supabase = await createClient()

        // Update password
        const { error } = await supabase
            .from("Users")
            .update({ password: hashedPassword })
            .eq("email", email)

        if (error) {
            console.error("Database error:", error)
            return NextResponse.json({ message: "Failed to update password" }, { status: 500 })
        }

        return NextResponse.json({ message: "Password updated successfully" })
    } catch (error) {
        console.error("Reset password error:", error)
        return NextResponse.json({ message: "Internal server error" }, { status: 500 })
    }
}
