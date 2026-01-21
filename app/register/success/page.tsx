"use client"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { CheckCircle2, Mail, Clock } from "lucide-react"
import Link from "next/link"

export default function RegisterSuccessPage() {
  const router = useRouter()

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-700 via-slate-800 to-slate-900 p-4 font-prompt">
      <Card className="w-full max-w-md shadow-sm border border-slate-700/50 bg-slate-800/70 backdrop-blur-md relative z-10">
        <CardHeader className="space-y-3 text-center pb-8">
          <div className="mx-auto w-16 h-16 bg-green-600/20 rounded-2xl flex items-center justify-center shadow-sm">
            <CheckCircle2 className="w-10 h-10 text-green-400" />
          </div>
          <CardTitle className="text-3xl font-bold text-gray-100">สมัครสมาชิกสำเร็จ!</CardTitle>
          <CardDescription className="text-base text-gray-300 font-light">
            ขอบคุณที่สมัครใช้งานระบบ KPI Tracker
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="bg-slate-700/50 border border-slate-600 rounded-lg p-6 space-y-4">
            <div className="flex items-start gap-3">
              <Clock className="w-5 h-5 text-yellow-400 mt-0.5 flex-shrink-0" />
              <div>
                <h3 className="font-semibold text-gray-100 mb-1">รอการอนุมัติ</h3>
                <p className="text-sm text-gray-300">บัญชีของคุณอยู่ระหว่างรอการอนุมัติจากผู้ดูแลระบบ</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Mail className="w-5 h-5 text-blue-400 mt-0.5 flex-shrink-0" />
              <div>
                <h3 className="font-semibold text-gray-100 mb-1">แจ้งเตือนทางอีเมล</h3>
                <p className="text-sm text-gray-300">เมื่อบัญชีของคุณได้รับการอนุมัติแล้ว คุณจะได้รับอีเมลแจ้งเตือน</p>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <Link href="/login" className="block">
              <Button className="w-full h-11 bg-slate-600 hover:bg-slate-500 text-white font-medium">
                ไปหน้าเข้าสู่ระบบ
              </Button>
            </Link>
            <Link href="/" className="block">
              <Button
                variant="outline"
                className="w-full h-11 border-slate-600 text-gray-300 hover:bg-slate-700 bg-transparent"
              >
                กลับไปหน้าแรก
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
