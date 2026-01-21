"use client"

import { useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { useAuth } from "@/app/context/AuthContext"
import { Button } from "@/components/ui/button"
import { KPICard } from "@/components/kpi-card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from "@dnd-kit/core"
import { arrayMove, SortableContext, sortableKeyboardCoordinates, rectSortingStrategy } from "@dnd-kit/sortable"
import { RotateCcw, LogIn, LogOut, User, Presentation, Calendar, ChevronDown, LayoutGrid, ListFilter, Sparkles } from "lucide-react"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Card, CardContent } from "@/components/ui/card"

interface AssignedUser {
  id: number
  name: string
}

interface Goal {
  id: number
  title: string
  target: number
  unit?: string
  progress: number
  percentage: number
  displayOrder: number
  isVisible: boolean
  assignedUsers?: AssignedUser[]
}

const THAI_MONTHS = [
  { value: "10", label: "ตุลาคม", shortLabel: "ต.ค." },
  { value: "11", label: "พฤศจิกายน", shortLabel: "พ.ย." },
  { value: "12", label: "ธันวาคม", shortLabel: "ธ.ค." },
  { value: "1", label: "มกราคม", shortLabel: "ม.ค." },
  { value: "2", label: "กุมภาพันธ์", shortLabel: "ก.พ." },
  { value: "3", label: "มีนาคม", shortLabel: "มี.ค." },
  { value: "4", label: "เมษายน", shortLabel: "เม.ย." },
  { value: "5", label: "พฤษภาคม", shortLabel: "พ.ค." },
  { value: "6", label: "มิถุนายน", shortLabel: "มิ.ย." },
  { value: "7", label: "กรกฎาคม", shortLabel: "ก.ค." },
  { value: "8", label: "สิงหาคม", shortLabel: "ส.ค." },
  { value: "9", label: "กันยายน", shortLabel: "ก.ย." },
]

export default function HomePage() {
  const { user } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()
  const [goals, setGoals] = useState<Goal[]>([])
  const [loading, setLoading] = useState(true)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [isFilterOpen, setIsFilterOpen] = useState(false)

  const getCurrentFiscalYearAndMonth = () => {
    const today = new Date()
    const currentMonth = today.getMonth() + 1
    const currentYear = today.getFullYear()
    const fiscalYear = currentMonth >= 10 ? currentYear + 1 : currentYear
    return {
      fiscalYear: fiscalYear.toString(),
      month: currentMonth.toString(),
    }
  }

  const { fiscalYear: defaultFiscalYear, month: defaultMonth } = getCurrentFiscalYearAndMonth()

  const [fiscalYear, setFiscalYear] = useState<string>(() => {
    return searchParams.get("fiscalYear") || defaultFiscalYear
  })

  const [selectedMonth, setSelectedMonth] = useState<string>(() => {
    return searchParams.get("month") || defaultMonth
  })

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  )

  const getDisplayValues = () => {
    const monthNum = Number.parseInt(selectedMonth)
    const fiscalYearNum = Number.parseInt(fiscalYear)
    const calendarYear = monthNum >= 10 ? fiscalYearNum - 1 : fiscalYearNum
    const shortYear = (calendarYear + 543) % 100
    const monthData = THAI_MONTHS.find((m) => m.value === selectedMonth)

    return {
      monthName: monthData?.label || "ตุลาคม",
      displayText: `${monthData?.label} ${shortYear.toString().padStart(2, "0")}`,
      fullYear: calendarYear + 543,
    }
  }

  const displayValues = getDisplayValues()

  useEffect(() => {
    fetchGoals()
  }, [fiscalYear, selectedMonth])

  async function fetchGoals() {
    try {
      const monthNum = Number.parseInt(selectedMonth)
      const fiscalYearNum = Number.parseInt(fiscalYear)
      const calendarYear = monthNum >= 10 ? fiscalYearNum - 1 : fiscalYearNum
      const startYear = fiscalYearNum - 1
      const startDate = `${startYear}-10-01`
      const lastDay = new Date(calendarYear, monthNum, 0).getDate()
      const endDate = `${calendarYear}-${selectedMonth.padStart(2, "0")}-${lastDay.toString().padStart(2, "0")}`

      const url = `/api/home?startDate=${startDate}&endDate=${endDate}`
      const response = await fetch(url, {
        credentials: "include", // Ensure cookies are sent for auth check
      })

      if (response.ok) {
        const data = await response.json()
        console.log("[v0] Frontend fetchGoals - Received data:", data)
        console.log("[v0] Frontend fetchGoals - All goals visibility:", data.goals?.map((g: any) => ({ id: g.id, title: g.title, isVisible: g.isVisible })))
        setGoals(data.goals || [])
      }
    } catch (error) {
      console.error("Error fetching goals:", error)
    } finally {
      setLoading(false)
    }
  }

  function handleReset() {
    const { fiscalYear: currentFiscalYear, month: currentMonth } = getCurrentFiscalYearAndMonth()
    setFiscalYear(currentFiscalYear)
    setSelectedMonth(currentMonth)
    const params = new URLSearchParams()
    router.push(`/?${params.toString()}`)
  }

  useEffect(() => {
    const params = new URLSearchParams()
    params.set("fiscalYear", fiscalYear)
    params.set("month", selectedMonth)
    const monthNum = Number.parseInt(selectedMonth)
    const fiscalYearNum = Number.parseInt(fiscalYear)
    const calendarYear = monthNum >= 10 ? fiscalYearNum - 1 : fiscalYearNum
    const startYear = fiscalYearNum - 1
    params.set("startMonth", "10")
    params.set("startYear", startYear.toString())
    params.set("endMonth", selectedMonth)
    params.set("endYear", calendarYear.toString())
    router.push(`/?${params.toString()}`, { scroll: false })
  }, [fiscalYear, selectedMonth])



  const fiscalYearOptions = Array.from({ length: 10 }, (_, i) => 2026 + i)

  const handleDragEnd = async (event: any) => {
    const { active, over } = event
    if (active.id !== over.id) {
      const oldIndex = goals.findIndex((goal) => goal.id.toString() === active.id)
      const newIndex = goals.findIndex((goal) => goal.id.toString() === over.id)
      const newGoals = arrayMove(goals, oldIndex, newIndex)
      setGoals(newGoals)

      try {
        const goalOrders = newGoals.map((goal, index) => ({
          id: goal.id,
          displayOrder: index + 1,
        }))
        await fetch("/api/goals/order", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ goalOrders }),
        })
      } catch (error) {
        console.error("Error updating goal order:", error)
        fetchGoals()
      }
    }
  }

  const handleToggleVisibility = async (goalId: number) => {
    const goal = goals.find((g) => g.id === goalId)
    if (!goal) return
    const newVisibility = !goal.isVisible
    const updatedGoals = goals.map((g) => (g.id === goalId ? { ...g, isVisible: newVisibility } : g))
    setGoals(updatedGoals)

    try {
      await fetch(`/api/goals/${goalId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ isVisible: newVisibility }),
      })
    } catch (error) {
      console.error("Error updating visibility:", error)
      setGoals(goals)
    }
  }

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen()
      setIsFullscreen(true)
    } else {
      document.exitFullscreen()
      setIsFullscreen(false)
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

  // Calculate summary stats
  const totalGoals = goals.length
  const completedGoals = goals.filter(g => g.percentage >= 100).length
  const inProgressGoals = totalGoals - completedGoals
  const averageProgress = totalGoals > 0 ? goals.reduce((acc, g) => acc + g.percentage, 0) / totalGoals : 0

  return (
    <div className="min-h-screen bg-background/50 transition-colors duration-300">
      <div className="fixed inset-0 -z-10 h-full w-full bg-background">
        <div className="absolute top-0 z-[-2] h-screen w-screen bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(120,119,198,0.1),rgba(255,255,255,0))]" />
      </div>

      <div className="container mx-auto px-6 py-8 max-w-[98%] space-y-8">
        {/* Top Bar / Header */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-6 border-b border-border/40">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground font-prompt">
              Dashboard
            </h1>
            <p className="text-sm text-muted-foreground font-prompt font-light mt-1">
              Overview of your performance for <span className="font-medium text-foreground">{displayValues.monthName} {displayValues.fullYear}</span>
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Popover open={isFilterOpen} onOpenChange={setIsFilterOpen}>
              <PopoverTrigger asChild>
                <Button variant="outline" className="h-10 px-4 font-prompt bg-background/80 backdrop-blur-sm rounded-lg border-border/60 hover:bg-accent hover:text-accent-foreground transition-all">
                  <Calendar className="w-4 h-4 mr-2 text-primary" />
                  <span>{displayValues.monthName} {displayValues.fullYear}</span>
                  <ChevronDown className="w-4 h-4 ml-2 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-80 p-4 rounded-xl shadow-lg border-border/40" align="end">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-xs font-medium text-muted-foreground font-prompt">Fiscal Year</label>
                    <Select value={fiscalYear} onValueChange={setFiscalYear}>
                      <SelectTrigger className="w-full font-prompt rounded-lg"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {fiscalYearOptions.map((year) => (
                          <SelectItem key={year} value={year.toString()} className="font-prompt">{year + 543}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-medium text-muted-foreground font-prompt">Month</label>
                    <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                      <SelectTrigger className="w-full font-prompt rounded-lg"><SelectValue>{displayValues.displayText}</SelectValue></SelectTrigger>
                      <SelectContent className="max-h-[200px]">
                        {THAI_MONTHS.map((month) => {
                          const monthNum = Number.parseInt(month.value)
                          const fiscalYearNum = Number.parseInt(fiscalYear)
                          const calendarYear = monthNum >= 10 ? fiscalYearNum - 1 : fiscalYearNum
                          const shortYear = (calendarYear + 543) % 100
                          return (
                            <SelectItem key={month.value} value={month.value} className="font-prompt">
                              {month.label} {shortYear.toString().padStart(2, "0")}
                            </SelectItem>
                          )
                        })}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="pt-2 flex justify-end">
                    <Button onClick={() => { handleReset(); setIsFilterOpen(false) }} variant="ghost" size="sm" className="font-prompt text-xs h-8 rounded-lg hover:bg-muted">
                      <RotateCcw className="w-3 h-3 mr-1.5" />Reset
                    </Button>
                  </div>
                </div>
              </PopoverContent>
            </Popover>

            <Button onClick={toggleFullscreen} variant="outline" size="icon" className="h-10 w-10 font-prompt bg-background/80 backdrop-blur-sm rounded-lg border-border/60 hover:bg-accent transition-all">
              <Presentation className="w-4 h-4 text-primary" />
            </Button>

            {user?.role === "ADMIN" && (
              <Button onClick={() => router.push("/goals")} className="h-10 px-4 font-prompt rounded-lg shadow-sm">
                Create KPI
              </Button>
            )}
          </div>
        </div>

        {/* Clean Stats Overview */}
        {goals.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="flex flex-col items-start justify-center p-6 bg-white rounded-2xl border border-border/40 shadow-sm hover:shadow-md transition-all duration-300">
              <span className="text-sm text-muted-foreground font-prompt mb-1">Total KPIs</span>
              <span className="text-4xl text-foreground font-prompt">{totalGoals}</span>
            </div>
            <div className="flex flex-col items-start justify-center p-6 bg-white rounded-2xl border border-border/40 shadow-sm hover:shadow-md transition-all duration-300">
              <span className="text-sm text-muted-foreground font-prompt mb-1">Completed</span>
              <span className="text-4xl text-green-600 font-prompt">{completedGoals}</span>
            </div>
            <div className="flex flex-col items-start justify-center p-6 bg-white rounded-2xl border border-border/40 shadow-sm hover:shadow-md transition-all duration-300">
              <span className="text-sm text-muted-foreground font-prompt mb-1">In Progress</span>
              <span className="text-4xl text-orange-500 font-prompt">{inProgressGoals}</span>
            </div>
            <div className="flex flex-col items-start justify-center p-6 bg-white rounded-2xl border border-border/40 shadow-sm hover:shadow-md transition-all duration-300">
              <span className="text-sm text-muted-foreground font-prompt mb-1">Average Progress</span>
              <span className="text-4xl text-blue-600 font-prompt">{averageProgress.toFixed(0)}%</span>
            </div>
          </div>
        )}

        {/* KPI Grid */}
        {goals.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-32 bg-white/50 backdrop-blur-sm rounded-[2rem] border border-dashed border-border/40">
            <div className="w-20 h-20 rounded-full bg-primary/5 flex items-center justify-center mb-6">
              <LayoutGrid className="w-10 h-10 text-primary/40" />
            </div>
            <h3 className="text-xl font-semibold text-foreground font-prompt mb-2">No KPIs Found</h3>
            <p className="text-muted-foreground font-prompt mb-8 text-center max-w-md font-light">
              There are no KPIs assigned for this period.
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold font-prompt text-foreground">Your KPIs</h2>
              <span className="text-sm text-muted-foreground font-prompt bg-secondary/50 px-3 py-1 rounded-full">{goals.length} Items</span>
            </div>

            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
              <SortableContext items={goals.map((g) => g.id.toString())} strategy={rectSortingStrategy}>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6">
                  {goals.map((goal) => (
                    <KPICard
                      key={goal.id}
                      id={goal.id}
                      title={goal.title}
                      progress={goal.progress}
                      target={goal.target}
                      unit={goal.unit}
                      percentage={goal.percentage}
                      isVisible={goal.isVisible}
                      isAdmin={user?.role === "ADMIN"}
                      assignedUsers={goal.assignedUsers}
                      onToggleVisibility={handleToggleVisibility}
                    />
                  ))}
                </div>
              </SortableContext>
            </DndContext>
          </div>
        )}
      </div>
    </div>
  )
}
