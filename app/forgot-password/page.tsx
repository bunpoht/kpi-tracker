"use client"

import type React from "react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import Link from "next/link"
import { Mail, ArrowRight, ArrowLeft, CheckCircle2 } from "lucide-react"

export default function ForgotPasswordPage() {
    const [email, setEmail] = useState("")
    const [loading, setLoading] = useState(false)
    const [submitted, setSubmitted] = useState(false)
    const [error, setError] = useState("")

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault()
        setError("")
        setLoading(true)

        try {
            const response = await fetch("/api/auth/forgot-password", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email }),
            })

            if (!response.ok) {
                const data = await response.json()
                throw new Error(data.message || "Something went wrong")
            }

            setSubmitted(true)
        } catch (err: any) {
            setError(err.message)
        } finally {
            setLoading(false)
        }
    }

    if (submitted) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background relative overflow-hidden font-prompt">
                <Card className="w-full max-w-md shadow-xl border-border/40 bg-card/80 backdrop-blur-xl relative z-10">
                    <CardContent className="pt-6 text-center space-y-4">
                        <div className="mx-auto w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-4">
                            <CheckCircle2 className="w-8 h-8" />
                        </div>
                        <h2 className="text-2xl font-bold text-foreground">ตรวจสอบอีเมลของคุณ</h2>
                        <p className="text-muted-foreground">
                            เราได้ส่งลิงก์สำหรับรีเซ็ตรหัสผ่านไปที่ <strong>{email}</strong> แล้ว
                        </p>
                        <div className="pt-4">
                            <Link href="/login">
                                <Button variant="outline" className="w-full h-11 font-medium">
                                    <ArrowLeft className="w-4 h-4 mr-2" />
                                    กลับไปหน้าเข้าสู่ระบบ
                                </Button>
                            </Link>
                        </div>
                    </CardContent>
                </Card>
            </div>
        )
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-background relative overflow-hidden font-prompt">
            {/* Background Elements */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0">
                <div className="absolute top-[-10%] right-[-5%] w-[500px] h-[500px] rounded-full bg-primary/5 blur-[100px]" />
                <div className="absolute bottom-[-10%] left-[-5%] w-[500px] h-[500px] rounded-full bg-orange-500/5 blur-[100px]" />
            </div>

            <Card className="w-full max-w-md shadow-xl border-border/40 bg-card/80 backdrop-blur-xl relative z-10">
                <CardHeader className="space-y-3 text-center pb-8">
                    <CardTitle className="text-2xl font-bold text-foreground">ลืมรหัสผ่าน?</CardTitle>
                    <CardDescription className="text-base text-muted-foreground">
                        กรอกอีเมลของคุณเพื่อรับลิงก์รีเซ็ตรหัสผ่าน
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div className="space-y-2">
                            <Label htmlFor="email" className="text-sm font-medium">
                                อีเมล
                            </Label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                <Input
                                    id="email"
                                    type="email"
                                    placeholder="name@example.com"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                    className="pl-10 h-11 bg-secondary/30 border-border/50 focus:bg-background transition-all"
                                />
                            </div>
                        </div>

                        {error && (
                            <div className="bg-destructive/10 border border-destructive/20 text-destructive px-4 py-3 rounded-lg text-sm flex items-center gap-2">
                                <div className="w-1.5 h-1.5 rounded-full bg-destructive" />
                                {error}
                            </div>
                        )}

                        <Button
                            type="submit"
                            className="w-full h-11 bg-gradient-to-r from-primary to-orange-500 hover:from-primary/90 hover:to-orange-500/90 text-white font-medium shadow-lg shadow-primary/20 transition-all duration-300 hover:scale-[1.02]"
                            disabled={loading}
                        >
                            {loading ? (
                                "กำลังส่ง..."
                            ) : (
                                <span className="flex items-center justify-center gap-2">
                                    ส่งลิงก์รีเซ็ต
                                    <ArrowRight className="w-4 h-4" />
                                </span>
                            )}
                        </Button>

                        <div className="text-center">
                            <Link href="/login" className="text-sm text-muted-foreground hover:text-foreground flex items-center justify-center gap-2">
                                <ArrowLeft className="w-4 h-4" />
                                กลับไปหน้าเข้าสู่ระบบ
                            </Link>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </div>
    )
}
