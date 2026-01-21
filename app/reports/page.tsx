"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts"
import { TrendingUp } from "lucide-react"

interface GoalReport {
  id: number
  title: string
  target: number
  totalCompleted: number
  percentage: number
  unit?: string
}

export default function ReportsPage() {
  const router = useRouter()
  const [goals, setGoals] = useState<GoalReport[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedMonth, setSelectedMonth] = useState<string>("all")
  const [selectedYear, setSelectedYear] = useState<string>(new Date().getFullYear().toString())

  useEffect(() => {
    fetchReports()
  }, [selectedMonth, selectedYear])

  async function fetchReports() {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (selectedMonth !== "all") params.append("month", selectedMonth)
      params.append("year", selectedYear)

      console.log("[v0] Fetching reports with params:", params.toString())
      const response = await fetch(`/api/reports?${params.toString()}`)
      if (response.ok) {
        const data = await response.json()
        console.log("[v0] Reports data received:", data)
        setGoals(data.goals)
      }
    } catch (error) {
      console.error("[v0] Error fetching reports:", error)
    } finally {
      setLoading(false)
    }
  }

  const months = [
    { value: "all", label: "All Months" },
    { value: "01", label: "January" },
    { value: "02", label: "February" },
    { value: "03", label: "March" },
    { value: "04", label: "April" },
    { value: "05", label: "May" },
    { value: "06", label: "June" },
    { value: "07", label: "July" },
    { value: "08", label: "August" },
    { value: "09", label: "September" },
    { value: "10", label: "October" },
    { value: "11", label: "November" },
    { value: "12", label: "December" },
  ]

  const currentYear = new Date().getFullYear()
  const years = Array.from({ length: 5 }, (_, i) => (currentYear - 2 + i).toString())

  const chartData = goals.map((goal) => ({
    name: goal.title.length > 20 ? goal.title.substring(0, 20) + "..." : goal.title,
    percentage: Number.parseFloat(goal.percentage.toFixed(1)),
  }))

  const COLORS = ["#06b6d4", "#8b5cf6", "#ec4899", "#f59e0b", "#10b981", "#3b82f6", "#ef4444"]

  const getColorForIndex = (index: number) => COLORS[index % COLORS.length]

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900">

        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900">

      <div className="container mx-auto px-4 py-8">
        <div className="space-y-8">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-xl shadow-lg">
              <TrendingUp className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-cyan-600 to-blue-600 bg-clip-text text-transparent">
                Overall Progress Dashboard
              </h1>
              <p className="text-muted-foreground mt-1">Track your goals and monitor performance</p>
            </div>
          </div>

          <Card className="border-2 shadow-sm">
            <CardContent className="pt-6">
              <div className="flex flex-wrap gap-4">
                <div className="flex-1 min-w-[200px]">
                  <label className="text-sm font-semibold mb-2 block text-foreground">Filter by period</label>
                  <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                    <SelectTrigger className="border-2 hover:border-primary/50 transition-colors">
                      <SelectValue placeholder="Select month" />
                    </SelectTrigger>
                    <SelectContent>
                      {months.map((month) => (
                        <SelectItem key={month.value} value={month.value}>
                          {month.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex-1 min-w-[200px]">
                  <label className="text-sm font-semibold mb-2 block text-foreground">Fiscal Year</label>
                  <Select value={selectedYear} onValueChange={setSelectedYear}>
                    <SelectTrigger className="border-2 hover:border-primary/50 transition-colors">
                      <SelectValue placeholder="Select year" />
                    </SelectTrigger>
                    <SelectContent>
                      {years.map((year) => (
                        <SelectItem key={year} value={year}>
                          Fiscal Year {year}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {goals.length === 0 ? (
            <Card className="border-2">
              <CardContent className="py-16">
                <div className="text-center space-y-2">
                  <p className="text-xl font-semibold text-muted-foreground">No goals found</p>
                  <p className="text-sm text-muted-foreground">
                    {selectedMonth !== "all"
                      ? "Try selecting a different period or year"
                      : "Create your first goal to get started"}
                  </p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {goals.map((goal, index) => {
                  const color = getColorForIndex(index)
                  return (
                    <Card
                      key={goal.id}
                      className="cursor-pointer hover:shadow-xl hover:scale-[1.02] transition-all duration-300 border-2 hover:border-primary/50 overflow-hidden group"
                      onClick={() => router.push(`/goals/${goal.id}`)}
                    >
                      <div className="h-2 w-full" style={{ backgroundColor: color }} />
                      <CardHeader className="pb-3">
                        <CardTitle className="text-lg font-bold group-hover:text-primary transition-colors">
                          {goal.title}
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          <div className="flex items-baseline gap-2">
                            <span className="text-4xl font-bold" style={{ color }}>
                              {goal.totalCompleted.toFixed(0)}
                            </span>
                            <span className="text-lg text-muted-foreground">
                              / {goal.target} {goal.unit || "units"}
                            </span>
                          </div>
                          <div>
                            <div className="flex justify-between items-center mb-2">
                              <span className="text-sm font-medium text-muted-foreground">Progress</span>
                              <span className="text-sm font-bold" style={{ color }}>
                                {goal.percentage.toFixed(1)}%
                              </span>
                            </div>
                            <div className="h-3 bg-secondary rounded-full overflow-hidden shadow-inner">
                              <div
                                className="h-full transition-all duration-500 rounded-full shadow-sm"
                                style={{
                                  width: `${Math.min(goal.percentage, 100)}%`,
                                  backgroundColor: color,
                                }}
                              />
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>

              <Card className="border-2 shadow-lg">
                <CardHeader>
                  <CardTitle className="text-2xl font-bold">Completion Percentage Overview</CardTitle>
                  <p className="text-sm text-muted-foreground">Visual comparison of goal completion rates</p>
                </CardHeader>
                <CardContent>
                  <div className="h-96">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 80 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
                        <XAxis
                          dataKey="name"
                          angle={-45}
                          textAnchor="end"
                          height={100}
                          tick={{ fill: "hsl(var(--foreground))", fontSize: 12 }}
                        />
                        <YAxis
                          label={{ value: "Completed (%)", angle: -90, position: "insideLeft" }}
                          tick={{ fill: "hsl(var(--foreground))" }}
                        />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: "hsl(var(--card))",
                            border: "2px solid hsl(var(--border))",
                            borderRadius: "8px",
                            boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                          }}
                          formatter={(value: number) => [`${value}%`, "Completed"]}
                        />
                        <Bar dataKey="percentage" radius={[8, 8, 0, 0]}>
                          {chartData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={getColorForIndex(index)} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
