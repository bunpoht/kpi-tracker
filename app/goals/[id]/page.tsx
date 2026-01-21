"use client"

import { useEffect, useState, useRef } from "react"
import { useParams, useRouter } from "next/navigation"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Button } from "@/components/ui/button"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { EditGoalDialog } from "@/components/edit-goal-dialog"
import { format } from "date-fns"
import { Trash2 } from "lucide-react"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"
import type { Goal, GoalAssignment, WorkLog } from "@/types"
import { useAuth } from "@/app/context/AuthContext"

interface GoalDetails {
  goal: Goal
  assignments: (GoalAssignment & { user: { id: number; name: string; email: string } })[]
  workLogs: (WorkLog & { user: { id: number; name: string; email: string }; images?: { id: number; url: string }[] })[]
}

interface MonthlyData {
  month: string
  total: number
}

const dataCache = new Map<number, { details: GoalDetails; monthly: MonthlyData[]; timestamp: number }>()
const CACHE_DURATION = 5 * 60 * 1000 // 5 minutes

export default function GoalDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { user } = useAuth()
  const [data, setData] = useState<GoalDetails | null>(null)
  const [loading, setLoading] = useState(true)
  const [deleting, setDeleting] = useState(false)
  const [monthlyData, setMonthlyData] = useState<MonthlyData[]>([])
  const [allGoals, setAllGoals] = useState<{ id: number; title: string; displayOrder: number; isVisible: boolean }[]>(
    [],
  )
  const [currentIndex, setCurrentIndex] = useState(-1)
  const [isTransitioning, setIsTransitioning] = useState(false)
  const prefetchedRef = useRef<Set<number>>(new Set())

  useEffect(() => {
    fetchGoalDetails()
    fetchMonthlyData()
    fetchAllGoals()
  }, [params.id])

  useEffect(() => {
    if (currentIndex >= 0 && allGoals.length > 0) {
      prefetchAdjacentGoals()
    }
  }, [currentIndex, allGoals])

  async function fetchGoalDetails() {
    const goalId = Number.parseInt(params.id as string)

    const cached = dataCache.get(goalId)
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      console.log("[v0] Using cached data for goal", goalId)
      setData(cached.details)
      setMonthlyData(cached.monthly)
      setLoading(false)
      return
    }

    try {
      const response = await fetch(`/api/goals/${params.id}`)
      if (response.ok) {
        const goalData = await response.json()
        setData(goalData)

        const monthlyResponse = await fetch(`/api/goals/${params.id}/monthly`)
        if (monthlyResponse.ok) {
          const monthlyResult = await monthlyResponse.json()
          setMonthlyData(monthlyResult.data)

          dataCache.set(goalId, {
            details: goalData,
            monthly: monthlyResult.data,
            timestamp: Date.now(),
          })
        }
      }
    } catch (error) {
      console.error("Failed to fetch goal details:", error)
    } finally {
      setLoading(false)
    }
  }

  async function fetchMonthlyData() {
    const goalId = Number.parseInt(params.id as string)
    const cached = dataCache.get(goalId)
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      return // Already loaded from cache
    }

    try {
      const response = await fetch(`/api/goals/${params.id}/monthly`)
      if (response.ok) {
        const result = await response.json()
        setMonthlyData(result.data)
      }
    } catch (error) {
      console.error("Failed to fetch monthly data:", error)
    }
  }

  async function fetchAllGoals() {
    try {
      const timestamp = Date.now()
      const response = await fetch(`/api/home?_t=${timestamp}`, {
        credentials: "include",
        cache: "no-store",
        headers: {
          "Cache-Control": "no-cache",
          Pragma: "no-cache",
        },
      })

      if (!response.ok) {
        console.error("[v0] Failed to fetch goals:", response.status, response.statusText)
        return
      }

      const result = await response.json()

      const sortedGoals = (result.goals || []).sort((a: any, b: any) => a.displayOrder - b.displayOrder)

      setAllGoals(sortedGoals)

      const currentId = Number.parseInt(params.id as string)
      const index = sortedGoals.findIndex((g: any) => g.id === currentId)

      setCurrentIndex(index)
    } catch (error) {
      console.error("[v0] Exception in fetchAllGoals:", error)
    }
  }

  async function prefetchAdjacentGoals() {
    const adjacentIds: number[] = []

    if (currentIndex > 0) {
      adjacentIds.push(allGoals[currentIndex - 1].id)
    }
    if (currentIndex < allGoals.length - 1) {
      adjacentIds.push(allGoals[currentIndex + 1].id)
    }

    for (const goalId of adjacentIds) {
      if (prefetchedRef.current.has(goalId)) continue

      const cached = dataCache.get(goalId)
      if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
        continue
      }

      try {
        const [detailsResponse, monthlyResponse] = await Promise.all([
          fetch(`/api/goals/${goalId}`),
          fetch(`/api/goals/${goalId}/monthly`),
        ])

        if (detailsResponse.ok && monthlyResponse.ok) {
          const details = await detailsResponse.json()
          const monthly = await monthlyResponse.json()

          dataCache.set(goalId, {
            details,
            monthly: monthly.data,
            timestamp: Date.now(),
          })

          prefetchedRef.current.add(goalId)
        }
      } catch (error) {
        console.error("[v0] Failed to prefetch goal", goalId, error)
      }
    }
  }

  async function handleDelete() {
    setDeleting(true)
    try {
      const response = await fetch(`/api/goals/${params.id}`, {
        method: "DELETE",
      })

      if (response.ok) {
        dataCache.delete(Number.parseInt(params.id as string))
        router.push("/goals")
      } else {
        const data = await response.json()
        alert(data.message || "Failed to delete goal")
      }
    } catch (error) {
      console.error("Failed to delete goal:", error)
      alert("Failed to delete goal")
    } finally {
      setDeleting(false)
    }
  }

  async function navigateWithTransition(targetUrl: string) {
    if ("startViewTransition" in document) {
      setIsTransitioning(true)
      await document.startViewTransition(() => {
        router.push(targetUrl)
      }).finished
      setIsTransitioning(false)
    } else {
      setIsTransitioning(true)
      await new Promise((resolve) => setTimeout(resolve, 300))
      router.push(targetUrl)
      setTimeout(() => setIsTransitioning(false), 100)
    }
  }

  async function refreshGoalsList() {
    await fetchAllGoals()
  }

  const hasPrevious = currentIndex > 0
  const hasNext = currentIndex < allGoals.length - 1

  function goToPrevious() {
    if (hasPrevious && allGoals.length > 0 && currentIndex > 0) {
      const prevGoal = allGoals[currentIndex - 1]
      navigateWithTransition(`/goals/${prevGoal.id}`)
    }
  }

  function goToNext() {
    if (hasNext && allGoals.length > 0 && currentIndex < allGoals.length - 1) {
      const nextGoal = allGoals[currentIndex + 1]
      navigateWithTransition(`/goals/${nextGoal.id}`)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-700 via-slate-800 to-slate-900">

        <div className="container mx-auto px-4 py-8">
          <p className="text-center text-gray-300 animate-pulse">Loading...</p>
        </div>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-700 via-slate-800 to-slate-900">

        <div className="container mx-auto px-4 py-8">
          <p className="text-center text-gray-300 animate-fade-in">Goal not found</p>
        </div>
      </div>
    )
  }

  const totalProgress = data.workLogs.reduce((sum, log) => sum + Number.parseFloat(log.completedWork.toString()), 0)
  const progressPercentage = Math.min((totalProgress / data.goal.target) * 100, 100)

  const chartData = monthlyData.map((item) => {
    const [year, month] = item.month.split("-")
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
    return {
      month: monthNames[Number.parseInt(month) - 1],
      total: item.total,
    }
  })

  const userProgress = data.assignments.map((assignment) => {
    const userLogs = data.workLogs.filter((log) => log.userId === assignment.userId)
    const completed = userLogs.reduce((sum, log) => sum + Number.parseFloat(log.completedWork.toString()), 0)
    const percentage = assignment.assignedTarget > 0 ? Math.min((completed / assignment.assignedTarget) * 100, 100) : 0
    return {
      ...assignment,
      completed,
      percentage,
    }
  })

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-700 via-slate-800 to-slate-900">

      <div
        className={`container mx-auto px-3 sm:px-4 md:px-6 py-4 sm:py-6 md:py-8 transition-opacity duration-300 ${isTransitioning ? "opacity-0" : "opacity-100"
          }`}
      >
        <div className="max-w-4xl mx-auto space-y-4 sm:space-y-5 md:space-y-6">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 sm:gap-4 animate-fade-in">
            <Button
              variant="outline"
              onClick={goToPrevious}
              disabled={!hasPrevious || isTransitioning}
              className="bg-slate-700/50 border-slate-600 text-gray-200 hover:bg-slate-600 hover:text-white transition-all duration-200 text-base sm:text-lg px-4 sm:px-6 py-5 sm:py-6 h-auto order-1 sm:order-none"
            >
              ← KPI ก่อนหน้า
            </Button>
            <Button
              variant="outline"
              onClick={() => navigateWithTransition("/")}
              disabled={isTransitioning}
              className="bg-slate-700/50 border-slate-600 text-gray-200 hover:bg-slate-600 hover:text-white transition-all duration-200 text-base sm:text-lg px-4 sm:px-6 py-5 sm:py-6 h-auto order-first sm:order-none"
            >
              🏠 หน้าแรก
            </Button>
            <Button
              variant="outline"
              onClick={goToNext}
              disabled={!hasNext || isTransitioning}
              className="bg-slate-700/50 border-slate-600 text-gray-200 hover:bg-slate-600 hover:text-white transition-all duration-200 text-base sm:text-lg px-4 sm:px-6 py-5 sm:py-6 h-auto order-2 sm:order-none"
            >
              KPI ถัดไป →
            </Button>
          </div>

          <Card className="bg-slate-800/70 backdrop-blur-md border-slate-700/50 animate-slide-up">
            <CardHeader className="p-4 sm:p-5 md:p-6">
              <div className="flex flex-col sm:flex-row items-start justify-between gap-4">
                <div className="flex-1 w-full">
                  <CardTitle className="text-xl sm:text-2xl text-gray-100">{data.goal.title}</CardTitle>
                  {data.goal.description && (
                    <p className="text-gray-300 mt-2 text-sm sm:text-base">{data.goal.description}</p>
                  )}
                </div>
                {user && (
                  <div className="flex gap-2 w-full sm:w-auto">
                    <EditGoalDialog goal={data.goal} assignments={data.assignments} onSuccess={fetchGoalDetails} />
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-red-400 hover:text-red-300 bg-slate-700/50 border-slate-600 hover:bg-red-900/20 flex-1 sm:flex-none h-10 sm:h-9"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent className="bg-slate-800 border-slate-700">
                        <AlertDialogHeader>
                          <AlertDialogTitle className="text-gray-100">Are you sure?</AlertDialogTitle>
                          <AlertDialogDescription className="text-gray-300">
                            This will permanently delete this goal and all related work logs. This action cannot be
                            undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel className="bg-slate-700 border-slate-600 text-gray-200 hover:bg-slate-600">
                            Cancel
                          </AlertDialogCancel>
                          <AlertDialogAction
                            onClick={handleDelete}
                            disabled={deleting}
                            className="bg-red-600 hover:bg-red-700 text-white"
                          >
                            {deleting ? "Deleting..." : "Delete Goal"}
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-4 sm:space-y-5 md:space-y-6 p-4 sm:p-5 md:p-6">
              <div>
                <div className="flex justify-between text-xs sm:text-sm mb-2">
                  <span className="text-gray-300">
                    {totalProgress.toFixed(0)} / {data.goal.target} {data.goal.unit || "units"}
                  </span>
                  <span className="font-medium text-gray-100">{progressPercentage.toFixed(2)}% Complete</span>
                </div>
                <Progress value={progressPercentage} className="h-4 sm:h-3" />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div>
                  <p className="text-xs sm:text-sm text-gray-300">Start Date</p>
                  <p className="font-medium text-gray-100 text-sm sm:text-base">
                    {format(new Date(data.goal.startDate), "MMM d, yyyy")}
                  </p>
                </div>
                <div>
                  <p className="text-xs sm:text-sm text-gray-300">End Date</p>
                  <p className="font-medium text-gray-100 text-sm sm:text-base">
                    {format(new Date(data.goal.endDate), "MMM d, yyyy")}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {chartData.length > 0 && (
            <Card
              className="bg-slate-800/70 backdrop-blur-md border-slate-700/50 animate-slide-up"
              style={{ animationDelay: "0.1s" }}
            >
              <CardHeader className="p-4 sm:p-5 md:p-6">
                <CardTitle className="text-gray-100 text-lg sm:text-xl">Fiscal Year Performance (Monthly)</CardTitle>
              </CardHeader>
              <CardContent className="p-4 sm:p-5 md:p-6">
                <div className="h-64 sm:h-72 md:h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgb(71 85 105)" />
                      <XAxis dataKey="month" tick={{ fill: "rgb(209 213 219)", fontSize: 12 }} />
                      <YAxis
                        label={{
                          value: `Progress (${data.goal.unit || "units"})`,
                          angle: -90,
                          position: "insideLeft",
                          fill: "rgb(209 213 219)",
                          fontSize: 12,
                        }}
                        tick={{ fill: "rgb(209 213 219)", fontSize: 12 }}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "rgb(30 41 59)",
                          border: "1px solid rgb(71 85 105)",
                          borderRadius: "6px",
                          color: "rgb(229 231 235)",
                          fontSize: 14,
                        }}
                        formatter={(value: number) => [value, `Progress (${data.goal.unit || "units"})`]}
                      />
                      <Bar dataKey="total" fill="#10b981" radius={[8, 8, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          )}

          {data.assignments.length > 0 && (
            <Card
              className="bg-slate-800/70 backdrop-blur-md border-slate-700/50 animate-slide-up"
              style={{ animationDelay: "0.2s" }}
            >
              <CardHeader className="p-4 sm:p-5 md:p-6">
                <CardTitle className="text-gray-100 text-lg sm:text-xl">การมอบหมายทีม</CardTitle>
              </CardHeader>
              <CardContent className="p-4 sm:p-5 md:p-6">
                <div className="space-y-3 sm:space-y-4">
                  {userProgress.map((assignment) => (
                    <div key={assignment.id} className="p-3 sm:p-4 bg-slate-700/50 rounded-lg space-y-2 sm:space-y-3">
                      <div className="flex flex-col sm:flex-row items-start justify-between gap-2 sm:gap-0">
                        <div>
                          <p className="font-medium text-gray-100 text-sm sm:text-base">{assignment.user.name}</p>
                          <p className="text-xs sm:text-sm text-gray-300">{assignment.user.email}</p>
                        </div>
                        <div className="text-left sm:text-right">
                          <p className="text-xs sm:text-sm text-gray-300">เป้าหมาย</p>
                          <p className="font-medium text-gray-100 text-sm sm:text-base">
                            {assignment.assignedTarget} {data.goal.unit || "หน่วย"}
                          </p>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <div className="flex justify-between text-xs sm:text-sm">
                          <span className="text-gray-300">
                            {assignment.completed.toFixed(0)} / {assignment.assignedTarget} {data.goal.unit || "หน่วย"}
                          </span>
                          <span className="font-medium text-gray-100">{assignment.percentage.toFixed(1)}%</span>
                        </div>
                        <Progress value={assignment.percentage} className="h-3 sm:h-2" />
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          <Card
            className="bg-slate-800/70 backdrop-blur-md border-slate-700/50 animate-slide-up"
            style={{ animationDelay: "0.3s" }}
          >
            <CardHeader className="p-4 sm:p-5 md:p-6">
              <CardTitle className="text-gray-100 text-lg sm:text-xl">บันทึกทั้งหมดของเป้าหมายนี้</CardTitle>
            </CardHeader>
            <CardContent className="p-4 sm:p-5 md:p-6">
              {data.workLogs.length === 0 ? (
                <p className="text-xs sm:text-sm text-gray-300 text-center py-6 sm:py-8">No work logs yet</p>
              ) : (
                <div className="space-y-3 sm:space-y-4">
                  {data.workLogs.map((log) => (
                    <div
                      key={log.id}
                      className="border border-slate-700/50 rounded-lg p-3 sm:p-4 space-y-2 sm:space-y-3 bg-slate-700/30"
                    >
                      {log.images && log.images.length > 0 && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                          {log.images.map((image) => (
                            <img
                              key={image.id}
                              src={image.url || "/placeholder.svg"}
                              alt="Work log"
                              className="w-full h-32 sm:h-40 object-cover rounded-lg"
                            />
                          ))}
                        </div>
                      )}
                      <div>
                        <p className="font-medium text-gray-100 text-sm sm:text-base">
                          {log.description || `ทำ ${data.goal.title}`} - {log.completedWork} {data.goal.unit || "หน่วย"}
                        </p>
                        <p className="text-xs sm:text-sm text-gray-300 mt-1">
                          by {log.user.name} on {format(new Date(log.date), "d MMMM yyyy")}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
