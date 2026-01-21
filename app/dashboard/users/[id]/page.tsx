"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { ArrowLeft, Target, TrendingUp, Calendar } from "lucide-react"

interface UserGoal {
  id: number
  title: string
  description: string
  unit: string
  target: number
  startDate: string
  endDate: string
  assignedTarget: number
  userProgress: number
  userPercentage: number
  totalWorkLogs: number
}

export default function UserDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [goals, setGoals] = useState<UserGoal[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchUserDetails()
  }, [params.id])

  async function fetchUserDetails() {
    try {
      const [usersRes, goalsRes] = await Promise.all([
        fetch("/api/users", { credentials: "include" }),
        fetch("/api/goals/with-progress", { credentials: "include" }),
      ])

      if (!usersRes.ok || !goalsRes.ok) {
        throw new Error("Failed to fetch data")
      }

      const { users } = await usersRes.json()
      const { goals: allGoals } = await goalsRes.json()

      const currentUser = users.find((u: any) => u.id === Number.parseInt(params.id as string))
      setUser(currentUser)

      const userGoals = allGoals
        .filter((goal: any) => goal.assignments?.some((a: any) => a.userId === currentUser.id))
        .map((goal: any) => {
          const assignment = goal.assignments.find((a: any) => a.userId === currentUser.id)
          const userLogs = goal.workLogs?.filter((log: any) => log.userId === currentUser.id) || []
          const userProgress = userLogs.reduce(
            (sum: number, log: any) => sum + Number.parseFloat(log.completedWork || "0"),
            0,
          )
          const userPercentage = (userProgress / (assignment?.assignedTarget || goal.target)) * 100

          return {
            id: goal.id,
            title: goal.title,
            description: goal.description,
            unit: goal.unit,
            target: goal.target,
            startDate: goal.startDate,
            endDate: goal.endDate,
            assignedTarget: assignment?.assignedTarget || goal.target,
            userProgress,
            userPercentage,
            totalWorkLogs: userLogs.length,
          }
        })

      setGoals(userGoals)
    } catch (error) {
      console.error("Failed to fetch user details:", error)
    } finally {
      setLoading(false)
    }
  }

  const formatThaiDate = (date: Date) => {
    const thaiMonths = ["ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.", "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค."]
    const day = date.getDate()
    const month = thaiMonths[date.getMonth()]
    const year = date.getFullYear() + 543
    return `${day} ${month} ${year}`
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-700 via-slate-800 to-slate-900">

        <div className="container mx-auto px-4 py-8">
          <p className="font-prompt font-light text-gray-300 text-center">กำลังโหลด...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-700 via-slate-800 to-slate-900">

        <div className="container mx-auto px-4 py-8">
          <p className="font-prompt font-light text-gray-300 text-center">ไม่พบข้อมูลผู้ใช้</p>
        </div>
      </div>
    )
  }

  const totalProgress = goals.reduce((sum, goal) => sum + goal.userProgress, 0)
  const averageCompletion =
    goals.length > 0 ? goals.reduce((sum, goal) => sum + goal.userPercentage, 0) / goals.length : 0

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-700 via-slate-800 to-slate-900">

      <div className="container mx-auto px-4 py-8">
        <Button
          variant="ghost"
          onClick={() => router.push("/dashboard/users")}
          className="mb-6 font-prompt text-gray-300 hover:text-gray-100 hover:bg-slate-700/50"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          กลับไปหน้ารายชื่อ
        </Button>

        <div className="mb-8">
          <h1 className="font-prompt text-4xl font-bold text-gray-100 mb-2">{user.name}</h1>
          <p className="font-prompt font-light text-gray-300">{user.email}</p>
        </div>

        <div className="grid gap-6 md:grid-cols-3 mb-8">
          <Card className="bg-slate-800/70 backdrop-blur-md border-slate-700/50">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-blue-500/20 flex items-center justify-center">
                  <Target className="w-6 h-6 text-blue-400" />
                </div>
                <div>
                  <p className="font-prompt text-sm font-light text-gray-300">เป้าหมายทั้งหมด</p>
                  <p className="font-prompt text-3xl font-bold text-gray-100">{goals.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-800/70 backdrop-blur-md border-slate-700/50">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-green-500/20 flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-green-400" />
                </div>
                <div>
                  <p className="font-prompt text-sm font-light text-gray-300">ความคืบหน้าเฉลี่ย</p>
                  <p className="font-prompt text-3xl font-bold text-gray-100">{averageCompletion.toFixed(1)}%</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-800/70 backdrop-blur-md border-slate-700/50">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-purple-500/20 flex items-center justify-center">
                  <Calendar className="w-6 h-6 text-purple-400" />
                </div>
                <div>
                  <p className="font-prompt text-sm font-light text-gray-300">บันทึกทั้งหมด</p>
                  <p className="font-prompt text-3xl font-bold text-gray-100">
                    {goals.reduce((sum, goal) => sum + goal.totalWorkLogs, 0)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <h2 className="font-prompt text-2xl font-bold text-gray-100">เป้าหมายทั้งหมด</h2>
          {goals.length === 0 ? (
            <Card className="bg-slate-800/70 backdrop-blur-md border-slate-700/50">
              <CardContent className="py-12">
                <p className="font-prompt font-light text-gray-300 text-center">ยังไม่มีเป้าหมายที่มอบหมาย</p>
              </CardContent>
            </Card>
          ) : (
            goals.map((goal) => (
              <Card
                key={goal.id}
                className="bg-slate-800/70 backdrop-blur-md border-slate-700/50 cursor-pointer hover:shadow-lg transition-shadow"
                onClick={() => router.push(`/kpi/${goal.id}?userId=${user.id}`)}
              >
                <CardHeader className="bg-slate-700/30 border-b border-slate-700/50">
                  <CardTitle className="font-prompt text-xl font-semibold text-gray-100">{goal.title}</CardTitle>
                  {goal.description && <p className="font-prompt font-light text-gray-300 mt-2">{goal.description}</p>}
                </CardHeader>
                <CardContent className="pt-6 space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="font-prompt text-sm font-light text-gray-300 mb-1">เป้าหมายที่ได้รับ</p>
                      <p className="font-prompt text-lg font-semibold text-gray-100">
                        {goal.assignedTarget} {goal.unit || "ชิ้น"}
                      </p>
                    </div>
                    <div>
                      <p className="font-prompt text-sm font-light text-gray-300 mb-1">ความคืบหน้า</p>
                      <p className="font-prompt text-lg font-semibold text-blue-400">
                        {goal.userProgress.toFixed(0)} {goal.unit || "ชิ้น"}
                      </p>
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-prompt text-sm font-light text-gray-300">
                        {goal.userPercentage.toFixed(1)}% เสร็จสมบูรณ์
                      </span>
                      <span className="font-prompt text-sm font-light text-gray-300">{goal.totalWorkLogs} บันทึก</span>
                    </div>
                    <Progress value={Math.min(goal.userPercentage, 100)} className="h-3" />
                  </div>

                  <div className="flex items-center gap-4 text-sm text-gray-300 pt-2 border-t border-slate-700/50">
                    <span className="font-prompt font-light">{formatThaiDate(new Date(goal.startDate))}</span>
                    <span>-</span>
                    <span className="font-prompt font-light">{formatThaiDate(new Date(goal.endDate))}</span>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
