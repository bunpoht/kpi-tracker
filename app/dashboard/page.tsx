"use client"

import { useEffect, useState } from "react"
import { WorkLogForm } from "@/components/work-log-form"
import { ActivityFeed } from "@/components/activity-feed"
import type { Goal, WorkLogWithDetails } from "@/types"
import { useAuth } from "@/app/context/AuthContext"
import { ChevronRight, Home, LayoutDashboard } from "lucide-react"
import Link from "next/link"

export default function DashboardPage() {
  const [goals, setGoals] = useState<Goal[]>([])
  const [workLogs, setWorkLogs] = useState<WorkLogWithDetails[]>([])
  const [loading, setLoading] = useState(true)
  const { user } = useAuth()

  useEffect(() => {
    fetchData()
  }, [])

  async function fetchData() {
    try {
      const [goalsRes, workLogsRes] = await Promise.all([fetch("/api/goals"), fetch("/api/worklogs")])

      if (goalsRes.ok) {
        const goalsData = await goalsRes.json()
        setGoals(goalsData.goals)
      }

      if (workLogsRes.ok) {
        const workLogsData = await workLogsRes.json()
        setWorkLogs(workLogsData.workLogs)
      }
    } catch (error) {
      console.error("Failed to fetch data:", error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="font-prompt font-light text-muted-foreground">กำลังโหลด...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background pb-12">
      {/* Breadcrumb / Header Area */}
      <div className="border-b border-border/40 bg-card/50 backdrop-blur-sm sticky top-0 z-20">
        <div className="container mx-auto px-4 py-4 max-w-7xl">
          <div className="flex items-center gap-2 text-sm text-muted-foreground font-prompt mb-2">
            <Link href="/" className="hover:text-primary flex items-center gap-1">
              <Home className="w-3 h-3" />
              หน้าแรก
            </Link>
            <ChevronRight className="w-3 h-3" />
            <span className="text-foreground font-medium">บันทึกผลงาน</span>
          </div>
          <h1 className="text-2xl font-bold text-foreground font-prompt">บันทึกผลงาน</h1>
          <p className="text-sm text-muted-foreground font-prompt mt-1">บันทึกและติดตามผลการปฏิบัติงานของคุณ</p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left Column: Main Form (8 cols) */}
          <div className="lg:col-span-8 space-y-8">
            <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
              <div className="p-6 border-b border-border/50 bg-secondary/10">
                <h2 className="text-lg font-semibold font-prompt flex items-center gap-2">
                  <LayoutDashboard className="w-5 h-5 text-primary" />
                  แบบฟอร์มบันทึกงาน
                </h2>
              </div>
              <div className="p-6">
                <WorkLogForm goals={goals} onSuccess={fetchData} />
              </div>
            </div>

            {/* Activity Feed (Below Form) */}
            <div className="space-y-4">
              <h2 className="text-lg font-semibold font-prompt text-foreground flex items-center gap-2 px-1">
                <span className="w-1 h-6 bg-primary rounded-full inline-block"></span>
                กิจกรรมล่าสุด
              </h2>
              <ActivityFeed workLogs={workLogs} onUpdate={fetchData} />
            </div>
          </div>

          {/* Right Column: Sidebar / Context (4 cols) */}
          <div className="lg:col-span-4 space-y-6">
            {/* User Profile Summary Card */}
            <div className="bg-card rounded-xl border border-border shadow-sm p-6 sticky top-24">
              <h3 className="font-prompt font-semibold text-lg mb-4 flex items-center gap-2">
                <div className="w-1 h-5 bg-orange-500 rounded-full"></div>
                ข้อมูลผู้ใช้งาน
              </h3>
              <div className="flex items-center gap-4 mb-6 p-4 bg-secondary/20 rounded-xl border border-border/50">
                <div className="w-14 h-14 rounded-full bg-gradient-to-br from-primary to-orange-400 flex items-center justify-center text-white font-bold text-2xl shadow-md ring-2 ring-background">
                  {user?.name.charAt(0)}
                </div>
                <div>
                  <p className="font-prompt font-medium text-foreground text-lg">{user?.name}</p>
                  <p className="font-prompt text-sm text-muted-foreground">{user?.email}</p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex justify-between items-center p-3 hover:bg-secondary/30 rounded-lg transition-colors border border-transparent hover:border-border/50">
                  <span className="text-sm font-prompt text-muted-foreground">เป้าหมายทั้งหมด</span>
                  <span className="font-prompt font-bold text-foreground">{goals.length}</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-secondary/30 rounded-lg">
                  <span className="text-sm font-prompt text-muted-foreground">บันทึกแล้ว</span>
                  <span className="font-prompt font-bold text-foreground">{workLogs.length}</span>
                </div>
              </div>
            </div>

            {/* Quick Tips / Help Card */}
            <div className="bg-blue-50/50 rounded-xl border border-blue-100 p-6">
              <h3 className="font-prompt font-semibold text-blue-900 mb-2">คำแนะนำ</h3>
              <p className="font-prompt text-sm text-blue-700 leading-relaxed">
                การบันทึกผลงานอย่างสม่ำเสมอช่วยให้คุณติดตามความก้าวหน้าได้ดียิ่งขึ้น อย่าลืมแนบรูปภาพผลงานเพื่อเป็นหลักฐานอ้างอิง
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
