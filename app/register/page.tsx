"use client"

import type React from "react"
import { useState } from "react"
import { useAuth } from "@/app/context/AuthContext"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import Link from "next/link"
import { UserPlus, Mail, Lock, UserIcon, ArrowRight } from "lucide-react"

export default function RegisterPage() {
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const { register } = useAuth()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError("")
    setLoading(true)

    try {
      await register(email, password, name)
    } catch (err: any) {
      setError(err.message || "Registration failed")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-700 via-slate-800 to-slate-900 p-4 font-prompt">
      <Card className="w-full max-w-md shadow-sm border border-slate-700/50 bg-slate-800/70 backdrop-blur-md relative z-10">
        <CardHeader className="space-y-3 text-center pb-8">
          <div className="mx-auto w-16 h-16 bg-slate-600/50 rounded-2xl flex items-center justify-center shadow-sm">
            <UserPlus className="w-8 h-8 text-slate-200" />
          </div>
          <CardTitle className="text-3xl font-bold text-gray-100">สร้างบัญชีใหม่</CardTitle>
          <CardDescription className="text-base text-gray-300 font-light">กรอกข้อมูลเพื่อเริ่มต้นใช้งาน</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="name" className="text-sm font-medium text-gray-200">
                ชื่อ-นามสกุล
              </Label>
              <div className="relative">
                <UserIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <Input
                  id="name"
                  type="text"
                  placeholder="จอห์น โด"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className="pl-10 h-11 bg-slate-700/50 border-slate-600 text-gray-100 placeholder:text-gray-400 focus:border-slate-500 focus:ring-slate-500"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium text-gray-200">
                อีเมล
              </Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="pl-10 h-11 bg-slate-700/50 border-slate-600 text-gray-100 placeholder:text-gray-400 focus:border-slate-500 focus:ring-slate-500"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm font-medium text-gray-200">
                รหัสผ่าน
              </Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <Input
                  id="password"
                  type="password"
                  placeholder="อย่างน้อย 6 ตัวอักษร"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                  className="pl-10 h-11 bg-slate-700/50 border-slate-600 text-gray-100 placeholder:text-gray-400 focus:border-slate-500 focus:ring-slate-500"
                />
              </div>
            </div>
            {error && (
              <div className="bg-red-900/30 border border-red-700/50 text-red-300 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}
            <Button
              type="submit"
              className="w-full h-11 bg-slate-600 hover:bg-slate-500 text-white font-medium shadow-sm transition-all duration-200"
              disabled={loading}
            >
              {loading ? (
                "กำลังสร้างบัญชี..."
              ) : (
                <span className="flex items-center justify-center gap-2">
                  สร้างบัญชี
                  <ArrowRight className="w-4 h-4" />
                </span>
              )}
            </Button>
          </form>
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-300 font-light">
              มีบัญชีอยู่แล้ว?{" "}
              <Link href="/login" className="text-slate-300 hover:text-slate-200 font-medium hover:underline">
                เข้าสู่ระบบ
              </Link>
            </p>
          </div>
          <div className="mt-6 pt-6 border-t border-slate-700 text-center">
            <Link
              href="/"
              className="text-sm text-gray-300 hover:text-gray-100 font-light hover:underline inline-flex items-center gap-1"
            >
              ← กลับไปหน้าแรก
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
