"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table"
import {
  Search,
  Filter,
  MoreVertical,
  ChevronRight,
  Home,
  User as UserIcon,
  Mail
} from "lucide-react"
import Link from "next/link"

interface UserStats {
  id: number
  name: string
  email: string
  role: string
  totalGoals: number
  activeGoals: number
  totalProgress: number
  averageCompletion: number
  profilePicture?: string
}

const AVATAR_COLORS = [
  "bg-pink-100 text-pink-600",
  "bg-blue-100 text-blue-600",
  "bg-green-100 text-green-600",
  "bg-purple-100 text-purple-600",
  "bg-orange-100 text-orange-600",
  "bg-teal-100 text-teal-600",
]

export default function UsersPage() {
  const router = useRouter()
  const [users, setUsers] = useState<UserStats[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")

  useEffect(() => {
    fetchUsersStats()
  }, [])

  async function fetchUsersStats() {
    try {
      const [usersRes, goalsRes] = await Promise.all([
        fetch("/api/users", { credentials: "include" }),
        fetch("/api/goals/with-progress", { credentials: "include" }),
      ])

      if (!usersRes.ok || !goalsRes.ok) {
        throw new Error("Failed to fetch data")
      }

      const { users } = await usersRes.json()
      const { goals } = await goalsRes.json()

      const userStats: UserStats[] = users.map((user: any) => {
        const userGoals = goals.filter((goal: any) => goal.assignments?.some((a: any) => a.userId === user.id))

        const totalGoals = userGoals.length
        const activeGoals = userGoals.filter((g: any) => {
          const now = new Date()
          const start = new Date(g.startDate)
          const end = new Date(g.endDate)
          return now >= start && now <= end
        }).length

        const totalProgress = userGoals.reduce((sum: number, goal: any) => {
          const userLogs = goal.workLogs?.filter((log: any) => log.userId === user.id) || []
          const userTotal = userLogs.reduce((s: number, log: any) => s + Number.parseFloat(log.completedWork || "0"), 0)
          return sum + userTotal
        }, 0)

        const averageCompletion =
          totalGoals > 0
            ? userGoals.reduce((sum: number, goal: any) => {
              const userLogs = goal.workLogs?.filter((log: any) => log.userId === user.id) || []
              const userTotal = userLogs.reduce(
                (s: number, log: any) => s + Number.parseFloat(log.completedWork || "0"),
                0,
              )
              const userTarget =
                goal.assignments?.find((a: any) => a.userId === user.id)?.assignedTarget || goal.target
              return sum + (userTotal / userTarget) * 100
            }, 0) / totalGoals
            : 0

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          totalGoals,
          activeGoals,
          totalProgress,
          averageCompletion,
          profilePicture: user.profilePicture,
        }
      })

      setUsers(userStats)
    } catch (error) {
      console.error("Failed to fetch users stats:", error)
    } finally {
      setLoading(false)
    }
  }

  const filteredUsers = users.filter(user =>
    user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.email.toLowerCase().includes(searchQuery.toLowerCase())
  )

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
            <span className="text-foreground font-medium">ทีมงาน</span>
          </div>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-foreground font-prompt">ติดตามผลงานรายบุคคล</h1>
              <p className="text-sm text-muted-foreground font-prompt mt-1">ดูความคืบหน้าและสถิติของสมาชิกในทีม</p>
            </div>

            <div className="flex items-center gap-2 w-full md:w-auto">
              <div className="relative flex-1 md:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="ค้นหาชื่อ หรือ อีเมล..."
                  className="pl-9 font-prompt bg-background"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <Button variant="outline" size="icon">
                <Filter className="w-4 h-4 text-muted-foreground" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-12">
            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4" />
            <p className="font-prompt text-muted-foreground">กำลังโหลดข้อมูล...</p>
          </div>
        ) : (
          <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-secondary/30 text-muted-foreground font-prompt border-b border-border">
                  <tr>
                    <th className="px-6 py-4 font-medium">ชื่อผู้ใช้งาน</th>
                    <th className="px-6 py-4 font-medium">สถานะ</th>
                    <th className="px-6 py-4 font-medium text-center">เป้าหมาย</th>
                    <th className="px-6 py-4 font-medium">ความคืบหน้าเฉลี่ย</th>
                    <th className="px-6 py-4 font-medium text-right">จัดการ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/50">
                  {filteredUsers.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-12 text-center text-muted-foreground font-prompt">
                        ไม่พบข้อมูลผู้ใช้งาน
                      </td>
                    </tr>
                  ) : (
                    filteredUsers.map((user, index) => (
                      <tr
                        key={user.id}
                        className="group hover:bg-secondary/20 transition-colors cursor-pointer"
                        onClick={() => router.push(`/dashboard/users/${user.id}`)}
                      >
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <Avatar className="w-10 h-10 border border-border">
                              <AvatarImage src={user.profilePicture || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.name}${user.name === "Chonthicha limpiti" ? "&top[]=longHair&top[]=longHairBob&top[]=longHairCurly&top[]=longHairStraight&facialHairProbability=0" : "&top[]=shortHair&top[]=shortHairTheCaesar&top[]=shortHairShortFlat&top[]=shortHairShortRound&top[]=shortHairShortWaved&facialHairProbability=20"}`} />
                              <AvatarFallback className={AVATAR_COLORS[index % AVATAR_COLORS.length]}>
                                {user.name.charAt(0)}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-medium font-prompt text-foreground group-hover:text-primary transition-colors">
                                {user.name}
                              </p>
                              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                <Mail className="w-3 h-3" />
                                {user.email}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <Badge variant="secondary" className="font-prompt font-normal bg-secondary text-secondary-foreground hover:bg-secondary">
                            {user.role}
                          </Badge>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <div className="flex flex-col items-center">
                            <span className="font-bold text-foreground">{user.activeGoals}</span>
                            <span className="text-[10px] text-muted-foreground">กำลังดำเนินการ</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 min-w-[200px]">
                          <div className="space-y-1.5">
                            <div className="flex justify-between text-xs font-prompt">
                              <span className="text-muted-foreground">เฉลี่ยรวม</span>
                              <span className="font-bold text-primary">{user.averageCompletion.toFixed(1)}%</span>
                            </div>
                            <Progress value={Math.min(user.averageCompletion, 100)} className="h-2" />
                          </div>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-primary">
                            <ChevronRight className="w-5 h-5" />
                          </Button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
