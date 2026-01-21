"use client"

import type React from "react"
import { useState, useEffect, Suspense } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { useRouter, useSearchParams } from "next/navigation"
import { Lock, ArrowRight, CheckCircle2, AlertCircle } from "lucide-react"
import Link from "next/link"

function ResetPasswordContent() {
    const [password, setPassword] = useState("")
    const [confirmPassword, setConfirmPassword] = useState("")
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState("")
    const [success, setSuccess] = useState(false)
    const searchParams = useSearchParams()
    const router = useRouter()
    const token = searchParams.get("token")

    useEffect(() => {
        if (!token) {
            setError("Invalid or missing reset token.")
        }
    }, [token])

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault()
        setError("")

        if (password !== confirmPassword) {
            setError("Passwords do not match")
            return
        }

        if (password.length < 6) {
            setError("Password must be at least 6 characters")
            return
        }

        setLoading(true)

        try {
            const response = await fetch("/api/auth/reset-password", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ token, password }),
            })

            if (!response.ok) {
                const data = await response.json()
                throw new Error(data.message || "Something went wrong")
            }

            setSuccess(true)
            setTimeout(() => {
                router.push("/login")
            }, 3000)
        } catch (err: any) {
            setError(err.message)
        } finally {
            setLoading(false)
        }
    }

    if (success) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background relative overflow-hidden font-prompt">
                <Card className="w-full max-w-md shadow-xl border-border/40 bg-card/80 backdrop-blur-xl relative z-10">
                    <CardContent className="pt-6 text-center space-y-4">
                        <div className="mx-auto w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-4">
                            <CheckCircle2 className="w-8 h-8" />
                        </div>
                        <h2 className="text-2xl font-bold text-foreground">เปลี่ยนรหัสผ่านสำเร็จ</h2>
                        <p className="text-muted-foreground">
                            รหัสผ่านของคุณได้รับการเปลี่ยนแปลงแล้ว กำลังนำคุณไปหน้าเข้าสู่ระบบ...
                        </p>
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
                    <CardTitle className="text-2xl font-bold text-foreground">ตั้งรหัสผ่านใหม่</CardTitle>
                    <CardDescription className="text-base text-muted-foreground">
                        กรุณากรอกรหัสผ่านใหม่ของคุณ
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div className="space-y-2">
                            <Label htmlFor="password" className="text-sm font-medium">
                                รหัสผ่านใหม่
                            </Label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                <Input
                                    id="password"
                                    type="password"
                                    placeholder="••••••••"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                    className="pl-10 h-11 bg-secondary/30 border-border/50 focus:bg-background transition-all"
                                />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="confirmPassword" className="text-sm font-medium">
                                ยืนยันรหัสผ่านใหม่
                            </Label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                <Input
                                    id="confirmPassword"
                                    type="password"
                                    placeholder="••••••••"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    required
                                    className="pl-10 h-11 bg-secondary/30 border-border/50 focus:bg-background transition-all"
                                />
                            </div>
                        </div>

                        {error && (
                            <div className="bg-destructive/10 border border-destructive/20 text-destructive px-4 py-3 rounded-lg text-sm flex items-center gap-2">
                                <AlertCircle className="w-4 h-4" />
                                {error}
                            </div>
                        )}

                        <Button
                            type="submit"
                            className="w-full h-11 bg-gradient-to-r from-primary to-orange-500 hover:from-primary/90 hover:to-orange-500/90 text-white font-medium shadow-lg shadow-primary/20 transition-all duration-300 hover:scale-[1.02]"
                            disabled={loading || !token}
                        >
                            {loading ? (
                                "กำลังบันทึก..."
                            ) : (
                                <span className="flex items-center justify-center gap-2">
                                    เปลี่ยนรหัสผ่าน
                                    <ArrowRight className="w-4 h-4" />
                                </span>
                            )}
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </div>
    )
}

export default function ResetPasswordPage() {
    return (
        <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
            <ResetPasswordContent />
        </Suspense>
    )
}
