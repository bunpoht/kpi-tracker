import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/db"
import { SignJWT } from "jose"

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || "your-secret-key-change-in-production")

export async function POST(request: NextRequest) {
    try {
        const { email } = await request.json()

        if (!email) {
            return NextResponse.json({ message: "Email is required" }, { status: 400 })
        }

        const supabase = await createClient()
        const { data: user, error } = await supabase.from("Users").select("*").eq("email", email).single()

        if (error || !user) {
            // Return success even if user not found to prevent enumeration
            return NextResponse.json({ message: "If an account exists, a reset link has been sent." })
        }

        // Generate reset token (valid for 1 hour)
        const token = await new SignJWT({ id: user.id, email: user.email, type: "reset" })
            .setProtectedHeader({ alg: "HS256" })
            .setExpirationTime("1h")
            .sign(JWT_SECRET)

        // Determine base URL
        let baseUrl = "https://dcc-kpi.vercel.app"

        // Use localhost in development
        if (process.env.NODE_ENV === "development") {
            baseUrl = "http://localhost:3000"
        }

        const resetLink = `${baseUrl}/reset-password?token=${token}`

        // Option 1: Send via Resend (No NPM install required)
        if (process.env.RESEND_API_KEY) {
            try {
                const res = await fetch("https://api.resend.com/emails", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        "Authorization": `Bearer ${process.env.RESEND_API_KEY}`,
                    },
                    body: JSON.stringify({
                        from: "KPI Tracker <onboarding@resend.dev>", // Use this default for testing
                        to: email,
                        subject: "Reset Your Password",
                        html: `<p>Click the link below to reset your password:</p><p><a href="${resetLink}">${resetLink}</a></p>`,
                    }),
                })

                if (!res.ok) {
                    const errorData = await res.json()
                    console.error("Resend API Error:", errorData)
                }
            } catch (emailError) {
                console.error("Failed to send email via Resend:", emailError)
            }
        }

        // Always log to console for debugging (or if no API key)
        console.log("=================================================================")
        console.log(`[PASSWORD RESET] Link for ${email}:`)
        console.log(resetLink)
        console.log("=================================================================")

        return NextResponse.json({ message: "If an account exists, a reset link has been sent." })
    } catch (error) {
        console.error("Forgot password error:", error)
        return NextResponse.json({ message: "Internal server error" }, { status: 500 })
    }
}
