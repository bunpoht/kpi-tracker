import { NextResponse } from "next/server"
import { createClient } from "@/lib/db"

// Next.js 15 changed params to be a Promise so we need to await it
export async function GET(request: Request, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  try {
    const { id } = await params
    const { searchParams } = new URL(request.url)
    const startDateParam = searchParams.get("startDate")
    const endDateParam = searchParams.get("endDate")

    console.log("[v0] GET /api/goals/[id]/monthly - startDate:", startDateParam, "endDate:", endDateParam)

    const supabase = await createClient()

    const { data: goal } = await supabase.from("Goals").select("startDate, endDate").eq("id", id).single()

    if (!goal) {
      return NextResponse.json({ message: "Goal not found" }, { status: 404 })
    }

    const { data: subMetrics } = await supabase
      .from("SubMetrics")
      .select("*")
      .eq("goalId", id)
      .order("displayOrder", { ascending: true })

    const { data: workLogs, error } = await supabase
      .from("WorkLogs")
      .select("date, completedWork, subMetricId, subMetricValues")
      .eq("goalId", id)
      .order("date", { ascending: true })

    if (error) {
      console.error("[v0] Error fetching work logs:", error)
      throw error
    }

    console.log("[v0] Found", workLogs?.length || 0, "total work logs")

    const filteredLogs = workLogs?.filter((log) => {
      if (!startDateParam || !endDateParam) return true
      const logDate = new Date(log.date)
      const start = new Date(startDateParam)
      const end = new Date(endDateParam)
      return logDate >= start && logDate <= end
    })

    console.log("[v0] Filtered to", filteredLogs?.length || 0, "work logs in date range")

    const monthlyTotals = new Map<string, Map<number | null, number>>()

    filteredLogs?.forEach((log) => {
      const date = new Date(log.date)
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`

      if (!monthlyTotals.has(monthKey)) {
        monthlyTotals.set(monthKey, new Map())
      }

      const subMetricMap = monthlyTotals.get(monthKey)!

      if (log.subMetricValues) {
        Object.entries(log.subMetricValues).forEach(([subMetricIdStr, value]) => {
          const subMetricId = Number.parseInt(subMetricIdStr)
          const current = subMetricMap.get(subMetricId) || 0
          subMetricMap.set(subMetricId, current + Number.parseFloat(String(value)))
        })
      } else {
        const subMetricId = log.subMetricId || null
        const current = subMetricMap.get(subMetricId) || 0
        subMetricMap.set(subMetricId, current + Number.parseFloat(log.completedWork || "0"))
      }
    })

    const goalStartDate = new Date(goal.startDate)
    const fiscalYearStart = new Date(goalStartDate.getFullYear(), 9, 1) // October 1st

    const fiscalYearMonths = []
    for (let i = 0; i < 12; i++) {
      const date = new Date(fiscalYearStart)
      date.setMonth(fiscalYearStart.getMonth() + i)
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`

      const subMetricMap = monthlyTotals.get(monthKey) || new Map()

      const monthData: any = { month: monthKey }

      if (subMetrics && subMetrics.length > 0) {
        subMetrics.forEach((sm) => {
          monthData[sm.name] = subMetricMap.get(sm.id) || 0
        })
        monthData._colors = subMetrics.reduce((acc: any, sm: any) => {
          acc[sm.name] = sm.color
          return acc
        }, {})
      } else {
        let total = 0
        subMetricMap.forEach((value) => {
          total += value
        })
        monthData.total = total
      }

      fiscalYearMonths.push(monthData)
    }

    console.log("[v0] Returning 12 months of fiscal year data with sub-metrics")

    return NextResponse.json({
      data: fiscalYearMonths,
      subMetrics: subMetrics || [],
    })
  } catch (error) {
    console.error("[v0] Error fetching monthly data:", error)
    return NextResponse.json({ message: "Failed to fetch monthly data", error: String(error) }, { status: 500 })
  }
}
